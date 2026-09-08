// ProjectFilters.tsx
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ProjectFiltersProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  typeFilter: string;
  setTypeFilter: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  projectTypes: string[];
  projectStatuses: string[];
}

const ProjectFilters = ({
  searchQuery,
  setSearchQuery,
  typeFilter,
  setTypeFilter,
  statusFilter,
  setStatusFilter,
  projectTypes,
  projectStatuses,
}: ProjectFiltersProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
      <div className="relative md:col-span-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search projects by name or description..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <Select value={typeFilter} onValueChange={setTypeFilter}>
        <SelectTrigger className="w-full md:col-span-3">
          <SelectValue placeholder="Filter by type" />
        </SelectTrigger>
        <SelectContent>
          {projectTypes.map((type) => (
            <SelectItem key={type} value={type}>
              {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-full md:col-span-3">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          {projectStatuses.map((status) => (
            <SelectItem key={status} value={status}>
              {status === 'all' ? 'All Statuses' : status.charAt(0).toUpperCase() + status.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ProjectFilters;