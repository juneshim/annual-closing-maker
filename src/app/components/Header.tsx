import React from 'react';

export function Header() {
  return (
    <header className="py-4 sm:py-6 lg:py-8 text-center">
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 mb-1 sm:mb-2">
        2025 연말 정산 생성 사이트
      </h1>
      <p className="text-sm sm:text-base lg:text-lg text-slate-600">
        그림러들을 위한 간단하고 빠른 연말 정산 이미지 생성
      </p>
    </header>
  );
}
