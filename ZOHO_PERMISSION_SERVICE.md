# Zoho CRM Permission Service

This service mimics Zoho CRM's permission behavior to determine which users can access/view a given module record based on organization sharing rules, user profile permissions, and role hierarchy.

## Overview

The Zoho Permission Service implements the same permission logic that Zoho CRM uses internally:

1. **Organization Default Sharing Rules**: Determines if a module is public or private at the organization level
2. **Profile Permissions**: Controls which modules a user can access based on their assigned profile
3. **Role Hierarchy**: For private modules, determines access based on reporting structure

## Architecture

### Core Components

- **ZohoPermissionService**: Main service that handles permission checks
- **ZohoUserSyncService**: Syncs users and their profile/role assignments from Zoho CRM
- **Database Models**: Extended to support user-profile and user-role relationships

### Database Schema Updates

The User model has been extended with:
- `zohoProfileId`: Links user to their Zoho CRM profile
- `zohoRoleId`: Links user to their Zoho CRM role

## API Endpoints

### Permission Check
```http
POST /api/zoho/permissions/check
```

Check permissions for a specific module record.

**Request Body:**
```json
{
  "organizationId": "org_123",
  "moduleName": "Contacts",
  "recordOwnerId": "zoho_user_456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userIds": ["zoho_user_456", "zoho_user_789"],
    "accessType": "private",
    "hierarchyUsed": true
  }
}
```

### Permission Summary
```http
GET /api/zoho/permissions/summary/:organizationId/:moduleName
```

Get detailed permission information for debugging.

### User Management
```http
POST /api/zoho/permissions/sync-users
GET /api/zoho/permissions/users/:organizationId
GET /api/zoho/permissions/users/zoho/:zohoUserId
GET /api/zoho/permissions/users/profile/:profileId
GET /api/zoho/permissions/users/role/:roleId
```

## Permission Logic

### 1. Public Access

When organization sharing rule is `public` or `public_read_only`:
- All users with profile permissions for the module can access the record
- Role hierarchy is ignored
- Faster computation as no hierarchy traversal is needed

### 2. Private Access

When organization sharing rule is `private`:
1. Check if record owner has module permission via their profile
2. If owner has access, get their role in the hierarchy
3. Find all users in the same level or higher in the role hierarchy
4. Filter users who also have module permissions via their profiles
5. Return owner + hierarchy users with module access

### Role Hierarchy Building

The service builds a role hierarchy tree based on `reportingToId` relationships:
- Top-level roles have `reportingToId = null`
- Child roles reference their parent via `reportingToId`
- Levels are calculated using breadth-first traversal
- Lower level numbers = higher in hierarchy

## Usage Examples

### Basic Permission Check

```typescript
import { zohoPermissionService } from './services/zohoPermissionService';

const result = await zohoPermissionService.checkModulePermissions({
  organizationId: 'org_123',
  moduleName: 'Contacts', 
  recordOwnerId: 'zoho_user_456'
});

console.log('Users who can access this contact:', result.userIds);
```

### Sync Users from Zoho

```typescript
import { zohoUserSyncService } from './services/zohoUserSyncService';

const syncResult = await zohoUserSyncService.syncUsersToDatabase('org_123');
console.log(`Synced ${syncResult.synced} users`);
```

### Get Permission Summary

```typescript
const summary = await zohoPermissionService.getPermissionSummary('org_123', 'Contacts');
console.log('Organization sharing rule:', summary.orgSharingRule);
console.log('Profiles with access:', summary.profilesWithModuleAccess);
console.log('Role hierarchy:', summary.roleHierarchy);
```

## Data Flow

### 1. Initial Setup (Admin Login)
1. Admin authenticates with Zoho CRM
2. System syncs organization, profiles, roles, and sharing rules
3. System syncs all users and their profile/role assignments
4. Database is populated with complete permission structure

### 2. Permission Check
1. Client requests permission check for a record
2. System looks up organization sharing rule for the module
3. If public: Returns all users with module access
4. If private: Builds role hierarchy and returns owner + hierarchy users with access

### 3. Ongoing Sync
- User assignments are re-synced when admins login
- Webhook events can trigger incremental updates
- Manual sync endpoints available for troubleshooting

## Configuration

### Environment Variables
- `ZOHO_CLIENT_ID`: Zoho CRM app client ID
- `ZOHO_CLIENT_SECRET`: Zoho CRM app client secret
- `DATABASE_URL`: PostgreSQL connection string

### Module Names
The service expects Zoho CRM API names for modules:
- `Contacts`
- `Leads` 
- `Accounts`
- `Deals`
- `Tasks`
- `Events`
- etc.

## Error Handling

The service includes comprehensive error handling:
- Missing organization sharing rules
- Users without profiles or roles
- Circular role hierarchies
- Invalid module names
- Database connection issues

## Performance Considerations

### Caching Strategy
- Organization sharing rules are cached per organization
- Role hierarchies are built once per organization
- User profile permissions are included in queries

### Optimization Tips
- Public modules are faster than private (no hierarchy traversal)
- Keep role hierarchies shallow for better performance
- Index database properly on foreign keys

### Database Indexes

Critical indexes for performance:
```sql
-- User lookups
CREATE INDEX idx_users_zoho_user_id ON users(zoho_user_id);
CREATE INDEX idx_users_org_profile ON users(organization_id, zoho_profile_id);
CREATE INDEX idx_users_org_role ON users(organization_id, zoho_role_id);

-- Permission lookups  
CREATE INDEX idx_profile_permissions_module ON zoho_profile_permissions(profile_id, module, enabled);

-- Role hierarchy
CREATE INDEX idx_roles_reporting_to ON zoho_roles(organization_id, reporting_to_id);
```

## Testing

### Unit Tests
Test individual permission scenarios:
- Public module access
- Private module with hierarchy
- Users without profiles/roles
- Circular role references

### Integration Tests
Test full permission flows:
- Admin login and sync
- Permission checks across different scenarios
- API endpoint responses

### Performance Tests
- Large organization with many users/roles
- Deep role hierarchies
- High-frequency permission checks

## Troubleshooting

### Common Issues

1. **No users returned for private module**
   - Check if owner has profile permission for module
   - Verify role hierarchy is correctly built
   - Ensure users have valid profile/role assignments

2. **Missing organization sharing rule**
   - Verify data sharing sync completed successfully
   - Check if module name matches Zoho API name exactly

3. **Role hierarchy issues**
   - Look for circular references in `reportingToId`
   - Ensure all roles belong to same organization
   - Check for orphaned roles (invalid `reportingToId`)

### Debug Endpoints

Use the permission summary endpoint for debugging:
```http
GET /api/zoho/permissions/summary/org_123/Contacts
```

This returns complete permission state for analysis.

## Future Enhancements

### Planned Features
- Field-level permissions
- Territory-based access control  
- Custom sharing rules beyond org defaults
- Permission caching with Redis
- Real-time webhook updates
- Audit trail for permission changes

### API Extensions
- Bulk permission checks
- Permission simulation/preview
- User permission reports
- Role-based dashboards

## Contributing

When extending the permission service:
1. Maintain compatibility with Zoho CRM behavior
2. Add comprehensive tests for new scenarios
3. Update documentation with new features
4. Consider performance impact of changes
5. Test with real Zoho CRM data when possible