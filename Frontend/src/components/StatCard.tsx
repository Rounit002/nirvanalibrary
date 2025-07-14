
import React, { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  iconBgColor: string;
  textColor?: string;
  arrowIcon?: ReactNode;
}

const StatCard = ({ title, value, icon, iconBgColor, textColor = 'text-gray-900', arrowIcon }: StatCardProps) => {
  return (
    <div className="bg-white rounded-xl p-5 flex flex-col shadow-sm border border-gray-100 relative overflow-hidden">
      <div className={`${iconBgColor} p-2 rounded-lg inline-block`}>
        {icon}
      </div>
      
      <h3 className="text-sm text-gray-500 mt-3">{title}</h3>
      <p className={`text-4xl font-semibold mt-1 ${textColor}`}>{value}</p>

      {arrowIcon && (
        <div className="absolute bottom-4 right-4">
          {arrowIcon}
        </div>
      )}
    </div>
  );
};

export default StatCard;
