import React from 'react';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';

const SearchFilters = ({ 
  searchQuery, 
  onSearchChange, 
  statusFilter, 
  onStatusFilterChange, 
  sortBy, 
  onSortChange,
  onClearFilters 
}) => {
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ];

  const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'created', label: 'Date Created' },
    { value: 'requests', label: 'Request Count' },
    { value: 'activity', label: 'Last Activity' }
  ];

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || sortBy !== 'created';

  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
        <div className="flex-1 max-w-md">
          <Input
            type="search"
            placeholder="Search webhooks by name or URL..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e?.target?.value)}
            className="w-full"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="w-full sm:w-40">
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={onStatusFilterChange}
              placeholder="Status"
            />
          </div>

          <div className="w-full sm:w-40">
            <Select
              options={sortOptions}
              value={sortBy}
              onChange={onSortChange}
              placeholder="Sort by"
            />
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              iconName="X"
              iconPosition="left"
              className="w-full sm:w-auto"
            >
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchFilters;