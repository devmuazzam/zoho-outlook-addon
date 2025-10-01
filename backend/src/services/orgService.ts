import { zohoCRMService } from './zohoCRM';
import { ZohoAPIResponse } from '../config/zoho';

export interface ZohoOrganization {
  id: string;
  company_name?: string;
  alias?: string;
  primary_email?: string;
  website?: string;
  mobile?: string;
  phone?: string;
  fax?: string;
  employee_count?: string;
  description?: string;
  time_zone?: string;
  currency?: string;
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  zip_code?: string;
  mc_status?: boolean;
  gapps_enabled?: boolean;
  domain_name?: string;
  translation_enabled?: boolean;
  privacy_settings?: boolean;
  action_required?: boolean;
  licence_details?: {
    users_licence_purchased?: number;
    users_licence_available?: number;
    type?: string;
    expiry?: string;
  };
}

export interface ZohoModule {
  api_name: string;
  module_name: string;
  id: string;
  tab_sequence: number;
  singular_label: string;
  plural_label: string;
  presence_sub_menu: boolean;
  triggers_supported: boolean;
  editable: boolean;
  deletable: boolean;
  creatable: boolean;
  viewable: boolean;
  api_supported: boolean;
  custom_module: boolean;
  scoring_supported: boolean;
  web_link?: string;
}

export interface ZohoProfile {
  id: string;
  name: string;
  category: string;
  description?: string;
  created_time?: string;
  modified_time?: string;
  permissions_details?: any[];
}

export class OrgService {
  /**
   * Get organization information from Zoho CRM
   */
  async getOrganization(): Promise<ZohoAPIResponse<{ org: ZohoOrganization[] }>> {
    return zohoCRMService.makeAPICall<{ org: ZohoOrganization[] }>('/org');
  }

  /**
   * Get all modules available in the organization
   */
  async getModules(): Promise<ZohoAPIResponse<{ modules: ZohoModule[] }>> {
    return zohoCRMService.makeAPICall<{ modules: ZohoModule[] }>('/settings/modules');
  }

  /**
   * Get specific module details by API name
   */
  async getModule(moduleApiName: string): Promise<ZohoAPIResponse<{ modules: ZohoModule[] }>> {
    return zohoCRMService.makeAPICall<{ modules: ZohoModule[] }>(`/settings/modules/${moduleApiName}`);
  }

  /**
   * Get all profiles in the organization
   */
  async getProfiles(): Promise<ZohoAPIResponse<{ profiles: ZohoProfile[] }>> {
    return zohoCRMService.makeAPICall<{ profiles: ZohoProfile[] }>('/settings/profiles');
  }

  /**
   * Get specific profile details by ID
   */
  async getProfile(profileId: string): Promise<ZohoAPIResponse<{ profiles: ZohoProfile[] }>> {
    return zohoCRMService.makeAPICall<{ profiles: ZohoProfile[] }>(`/settings/profiles/${profileId}`);
  }

  /**
   * Get organization variables
   */
  async getVariables(): Promise<ZohoAPIResponse<any>> {
    return zohoCRMService.makeAPICall('/settings/variables');
  }

  /**
   * Get organization currencies
   */
  async getCurrencies(): Promise<ZohoAPIResponse<any>> {
    return zohoCRMService.makeAPICall('/org/currencies');
  }

  /**
   * Get organization roles
   */
  async getRoles(): Promise<ZohoAPIResponse<any>> {
    return zohoCRMService.makeAPICall('/settings/roles');
  }

  /**
   * Get organization territories
   */
  async getTerritories(): Promise<ZohoAPIResponse<any>> {
    return zohoCRMService.makeAPICall('/settings/territories');
  }

  /**
   * Get custom views for a module
   */
  async getCustomViews(moduleApiName: string): Promise<ZohoAPIResponse<any>> {
    return zohoCRMService.makeAPICall(`/settings/custom_views?module=${moduleApiName}`);
  }

  /**
   * Get field metadata for a module
   */
  async getFields(moduleApiName: string): Promise<ZohoAPIResponse<any>> {
    return zohoCRMService.makeAPICall(`/settings/fields?module=${moduleApiName}`);
  }

  /**
   * Get layouts for a module
   */
  async getLayouts(moduleApiName: string): Promise<ZohoAPIResponse<any>> {
    return zohoCRMService.makeAPICall(`/settings/layouts?module=${moduleApiName}`);
  }

  /**
   * Get organization metadata (comprehensive info)
   */
  async getOrgMetadata(): Promise<{
    organization: ZohoAPIResponse<{ org: ZohoOrganization[] }>;
    modules: ZohoAPIResponse<{ modules: ZohoModule[] }>;
    profiles: ZohoAPIResponse<{ profiles: ZohoProfile[] }>;
    currencies: ZohoAPIResponse<any>;
    roles: ZohoAPIResponse<any>;
  }> {
    const [organization, modules, profiles, currencies, roles] = await Promise.all([
      this.getOrganization(),
      this.getModules(),
      this.getProfiles(),
      this.getCurrencies(),
      this.getRoles(),
    ]);

    return {
      organization,
      modules,
      profiles,
      currencies,
      roles,
    };
  }

  /**
   * Get module-specific metadata
   */
  async getModuleMetadata(moduleApiName: string): Promise<{
    module: ZohoAPIResponse<{ modules: ZohoModule[] }>;
    fields: ZohoAPIResponse<any>;
    layouts: ZohoAPIResponse<any>;
    customViews: ZohoAPIResponse<any>;
  }> {
    const [module, fields, layouts, customViews] = await Promise.all([
      this.getModule(moduleApiName),
      this.getFields(moduleApiName),
      this.getLayouts(moduleApiName),
      this.getCustomViews(moduleApiName),
    ]);

    return {
      module,
      fields,
      layouts,
      customViews,
    };
  }

  /**
   * Check if a module is enabled and accessible
   */
  async isModuleAccessible(moduleApiName: string): Promise<boolean> {
    try {
      const result = await this.getModule(moduleApiName);
      return result.success && 
             result.data?.modules?.[0]?.api_supported === true &&
             result.data?.modules?.[0]?.viewable === true;
    } catch (error) {
      console.error(`❌ Failed to check module accessibility for ${moduleApiName}:`, error);
      return false;
    }
  }

  /**
   * Get organization limits and usage
   */
  async getOrgLimits(): Promise<ZohoAPIResponse<any>> {
    return zohoCRMService.makeAPICall('/org/limits');
  }

  /**
   * Get organization preferences
   */
  async getOrgPreferences(): Promise<ZohoAPIResponse<any>> {
    return zohoCRMService.makeAPICall('/org/preferences');
  }
}

export const orgService = new OrgService();