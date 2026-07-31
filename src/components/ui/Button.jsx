import * as React from 'react';

const join = (...parts) => parts.filter(Boolean).join(' ');

const baseClass =
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 active:scale-[0.97]';

const variantClass = {
  default: 'bg-slate-800 text-white hover:bg-slate-700 shadow-sm hover:shadow',
  destructive: 'bg-red-600 text-white hover:bg-red-700 shadow-sm hover:shadow-md',
  outline: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-sm',
  secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 shadow-sm',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-800',
  link: 'text-green-600 underline-offset-4 hover:underline',
  green: 'bg-green-600 text-white hover:bg-green-700 shadow-sm hover:shadow-md',
  blue: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md',
};

const sizeClass = {
  default: 'h-10 px-4 py-2',
  sm: 'h-8 rounded-lg px-3 text-xs',
  xs: 'h-7 rounded-md px-2 text-xs gap-1',
  lg: 'h-11 rounded-lg px-6',
  icon: 'h-10 w-10',
};

const Button = React.forwardRef(
  ({ className, variant = 'default', size = 'default', asChild = false, children, ...props }, ref) => {
    const classes = join(baseClass, variantClass[variant] || variantClass.default, sizeClass[size] || sizeClass.default, className);

    if (asChild) {
      const onlyChild = React.Children.only(children);
      if (!React.isValidElement(onlyChild)) return null;
      return React.cloneElement(onlyChild, {
        ...props,
        className: join(onlyChild.props?.className, classes),
        ref,
      });
    }

    return (
      <button ref={ref} className={classes} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
