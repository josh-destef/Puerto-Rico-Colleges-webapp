import { useMemo } from 'react';
import { useFilterStore } from '../store/filterStore';
import type { InstitutionFeature } from '../types';
import { institutionData } from '../data/institutions';

export function useInstitutions() {
  const {
    showPublic,
    showPrivateNonProfit,
    showPrivateForProfit,
    filterNursing,
    filterEngineering,
    filterHumanities,
    filterBusiness,
    filterGrad,
    activeOnly,
    mainCampusOnly,
    searchQuery,
  } = useFilterStore();

  const data = institutionData;

  const filtered = useMemo<InstitutionFeature[]>(() => {
    const q = searchQuery.toLowerCase().trim();
    return data.features.filter((f) => {
      const p = f.properties;

      // Search query filter
      if (q && !p.name.toLowerCase().includes(q)) return false;

      // Ownership filter
      if (p.ownership === 'Public' && !showPublic) return false;
      if (p.ownership === 'Private Non-Profit' && !showPrivateNonProfit) return false;
      if (p.ownership === 'Private For-Profit' && !showPrivateForProfit) return false;

      // Active only
      if (activeOnly && !p.active) return false;

      // Main campus only
      if (mainCampusOnly && !p.is_main_campus) return false;

      // Academic program filters (OR logic – must have at least one selected)
      const programFiltersActive = filterNursing || filterEngineering || filterHumanities || filterBusiness || filterGrad;
      if (programFiltersActive) {
        const match =
          (filterNursing && p.flags.has_nursing) ||
          (filterEngineering && p.flags.has_engineering) ||
          (filterHumanities && p.flags.has_humanities) ||
          (filterBusiness && p.flags.has_business) ||
          (filterGrad && p.flags.has_grad);
        if (!match) return false;
      }

      return true;
    });
  }, [data, searchQuery, showPublic, showPrivateNonProfit, showPrivateForProfit, activeOnly, mainCampusOnly, filterNursing, filterEngineering, filterHumanities, filterBusiness, filterGrad]);

  const aggregates = useMemo(() => {
    const active = filtered.filter((f) => f.properties.active);
    const totalEnrollment = active.reduce((sum, f) => sum + (f.properties.enrollment ?? 0), 0);

    const withTuition = active.filter((f) => f.properties.tuition_in_state !== null && f.properties.tuition_in_state !== undefined);
    const avgTuition = withTuition.length > 0
      ? withTuition.reduce((sum, f) => sum + (f.properties.tuition_in_state ?? 0), 0) / withTuition.length
      : null;

    const withNetPrice = active.filter((f) => f.properties.avg_net_price !== null && f.properties.avg_net_price !== undefined);
    const avgNetPrice = withNetPrice.length > 0
      ? withNetPrice.reduce((sum, f) => sum + (f.properties.avg_net_price ?? 0), 0) / withNetPrice.length
      : null;

    const withEarnings = active.filter((f) => f.properties.median_earnings_10yr !== null && f.properties.median_earnings_10yr !== undefined);
    const avgEarnings = withEarnings.length > 0
      ? withEarnings.reduce((sum, f) => sum + (f.properties.median_earnings_10yr ?? 0), 0) / withEarnings.length
      : null;

    return { totalEnrollment, avgTuition, avgNetPrice, avgEarnings };
  }, [filtered]);

  return { data, filtered, aggregates };
}
