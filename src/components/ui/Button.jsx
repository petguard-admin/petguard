import * as React from 'react';

const join = (...parts) => parts.filter(Boolean).join(' ');

const baseClass =
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

const variantClass = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  destructive: 'bg-red-600 text-white hover:bg-red-700',
  outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  link: 'text-primary underline-offset-4 hover:underline',
  green: 'bg-green-700 text-white hover:bg-green-800',
  blue: 'bg-blue-600 text-white hover:bg-blue-700',
};

const sizeClass = {
  default: 'h-10 px-4 py-2',
  sm: 'h-9 rounded-md px-3',
  lg: 'h-11 rounded-md px-8',
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
