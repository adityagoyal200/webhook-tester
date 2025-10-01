import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

type HTTPMethod = '' | 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface Filters {
  search: string;
  method: HTTPMethod;
  status: string;
  ipAddress: string;
}

interface RequestFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  onClearFilters: () => void;
  onExportData: () => void;
  totalRequests: number;
}

const RequestFilters = ({
  filters,
  onFiltersChange,
  onClearFilters,
  onExportData,
  totalRequests,
}: RequestFiltersProps) => {
  const methodOptions: { value: HTTPMethod; label: string }[] = [
    { value: '', label: 'All Methods' },
    { value: 'GET', label: 'GET' },
    { value: 'POST', label: 'POST' },
    { value: 'PUT', label: 'PUT' },
    { value: 'DELETE', label: 'DELETE' },
    { value: 'PATCH', label: 'PATCH' }
  ];

  const statusOptions: { value: string; label: string }[] = [
    { value: '', label: 'All Status' },
    { value: '200', label: '200 - OK' },
    { value: '201', label: '201 - Created' },
    { value: '400', label: '400 - Bad Request' },
    { value: '401', label: '401 - Unauthorized' },
    { value: '404', label: '404 - Not Found' },
    { value: '500', label: '500 - Server Error' }
  ];

  const handleFilterChange = (key: keyof Filters, value: Filters[keyof Filters]) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const hasActiveFilters = Object.values(filters)?.some(value => value !== '');

  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            type="search"
            placeholder="Search payload content..."
            value={filters?.search}
            onChange={(e) => handleFilterChange('search', e?.target?.value)}
            className="w-full"
          />
          
          <Select
            placeholder="Filter by method"
            options={methodOptions}
            value={filters?.method}
            onChange={(value) => handleFilterChange('method', (value ? String(value) : '') as Filters['method'])}
          />
          
          <Select
            placeholder="Filter by status"
            options={statusOptions}
            value={filters?.status}
            onChange={(value) => handleFilterChange('status', value ? String(value) : '')}
          />
          
          <Input
            type="text"
            placeholder="Filter by IP address"
            value={filters?.ipAddress}
            onChange={(e) => handleFilterChange('ipAddress', e?.target?.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              iconName="X"
              onClick={onClearFilters}
            >
              Clear
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            iconName="Download"
            onClick={onExportData}
            disabled={totalRequests === 0}
          >
            Export
          </Button>
        </div>
      </div>
      {hasActiveFilters && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon name="Filter" size={16} />
            <span>
              Showing {totalRequests} filtered result{totalRequests !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestFilters;