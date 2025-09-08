import * as React from "react";

export function Logo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <div className="bg-primary p-1.5 rounded-lg">
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <path
          d="M8.5 21V11.75C8.5 9.12665 10.6266 7 13.25 7H20.5"
          stroke="hsl(var(--accent))"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5 18V8.625C5 5.94264 7.12538 3.75 9.80773 3.75H17.5"
          stroke="hsl(var(--accent))"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
