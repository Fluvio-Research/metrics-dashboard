import { useEffect, useState } from 'react';
import { getBackendSrv } from '@grafana/runtime';
import { DashboardSearchItem } from 'app/features/search/types';

interface UseDashboardListOptions {
  limit?: number;
  enabled?: boolean;
}

export function useDashboardList(options: UseDashboardListOptions = {}) {
  const { limit = 20, enabled = true } = options;
  const [dashboards, setDashboards] = useState<DashboardSearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const fetchDashboards = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const params = {
          type: 'dash-db',
          limit: limit,
          sort: 'name_sort',
        };
        
        const result = await getBackendSrv().search(params);
        setDashboards(result || []);
      } catch (err) {
        console.error('Failed to fetch dashboards:', err);
        setError('Failed to fetch dashboards');
        setDashboards([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboards();
  }, [limit, enabled]);

  return { dashboards, loading, error };
}
