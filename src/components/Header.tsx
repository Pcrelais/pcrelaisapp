import React from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  return (
    <div className="bg-primary text-white py-6">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold">{title}</h1>
        {subtitle && <p className="mt-2 text-primary-100">{subtitle}</p>}
      </div>
    </div>
  );
};

export default Header;
