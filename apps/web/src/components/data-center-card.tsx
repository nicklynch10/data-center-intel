type DataCenter = {
  id: string;
  name?: string;
  status?: 'planned' | 'under_construction' | 'operational';
  developer?: string;
  sqft?: string;
  powerMw?: string;
  firstSeen?: string;
  lastSeen?: string;
};

export function DataCenterCard({ dataCenter }: { dataCenter: DataCenter }) {
  const statusColors = {
    planned: 'bg-yellow-100 text-yellow-800',
    under_construction: 'bg-orange-100 text-orange-800',
    operational: 'bg-green-100 text-green-800',
  };

  const statusLabels = {
    planned: 'Planned',
    under_construction: 'Under Construction',
    operational: 'Operational',
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold">
          {dataCenter.name || 'Unnamed Data Center'}
        </h3>
        {dataCenter.status && (
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              statusColors[dataCenter.status]
            }`}
          >
            {statusLabels[dataCenter.status]}
          </span>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4 text-sm">
        {dataCenter.developer && (
          <div>
            <span className="text-gray-500">Developer:</span>
            <span className="ml-2 font-medium">{dataCenter.developer}</span>
          </div>
        )}

        {dataCenter.sqft && (
          <div>
            <span className="text-gray-500">Size:</span>
            <span className="ml-2 font-medium">
              {Number(dataCenter.sqft).toLocaleString()} sq ft
            </span>
          </div>
        )}

        {dataCenter.powerMw && (
          <div>
            <span className="text-gray-500">Power:</span>
            <span className="ml-2 font-medium">{dataCenter.powerMw} MW</span>
          </div>
        )}

        {dataCenter.firstSeen && (
          <div>
            <span className="text-gray-500">First seen:</span>
            <span className="ml-2 font-medium">
              {new Date(dataCenter.firstSeen).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}