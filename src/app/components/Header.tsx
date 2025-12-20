import React from 'react';
import { strings } from '../utils/strings';

export function Header() {
  return (
    <header className="py-4 sm:py-6 lg:py-8 text-center">
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 mb-1 sm:mb-2">
        {strings.header.title}
      </h1>
      <p className="text-sm sm:text-base lg:text-lg text-slate-600">
        {strings.header.subtitle}
      </p>
    </header>
  );
}
