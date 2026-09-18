import React from 'react';

const Header = () => {
  return (
    <header className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-2">
        <img src="/icon.png" alt="PomoSync" className="w-7 h-7 rounded-lg" />
        <span className="font-bold text-gray-900 text-lg">PomoSync</span>
      </div>
      <div className="text-center">
        <h1 className="font-bold text-gray-900">Weekend List</h1>
        <span className="text-xs text-gray-400 tracking-wider uppercase">GOOGLE</span>
      </div>
    </header>
  );
};

export default Header;