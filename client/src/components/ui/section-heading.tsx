import React from 'react';

interface SectionHeadingProps {
  title: string;
  description?: string;
  align?: 'left' | 'center' | 'right';
  titleClassName?: string;
  descriptionClassName?: string;
}

export function SectionHeading({
  title,
  description,
  align = 'center',
  titleClassName = 'text-3xl md:text-4xl',
  descriptionClassName = 'text-white/70'
}: SectionHeadingProps) {
  const alignmentClass = {
    left: 'text-left',
    center: 'text-center mx-auto',
    right: 'text-right ml-auto'
  }[align];
  
  return (
    <div className={`max-w-3xl ${alignmentClass} mb-10`}>
      <h2 className={`font-bold ${titleClassName} bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-cyan-400 to-indigo-400`}>
        {title}
      </h2>
      {description && (
        <p className={`mt-3 ${descriptionClassName}`}>
          {description}
        </p>
      )}
    </div>
  );
}