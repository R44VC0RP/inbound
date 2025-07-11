import React, {SVGProps} from 'react';

type IconProps = SVGProps<SVGSVGElement> & {
	secondaryfill?: string;
	strokewidth?: number;
	title?: string;
}

function ChartTrendUp({fill = 'currentColor', secondaryfill, title = 'badge 13', ...props}: IconProps) {
	secondaryfill = secondaryfill || fill;

	return (
		<svg height="18" width="18" {...props} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M15.25,5.5h-3.5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h1.689l-2.689,2.689-3.116-3.116c-.486-.487-1.281-.487-1.768,0l-3.646,3.646,1.061,1.061,3.47-3.47,3.116,3.116c.243,.244,.563,.366,.884,.366s.641-.122,.884-.366l2.866-2.866v1.689c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-3.5c0-.414-.336-.75-.75-.75Z" fill={secondaryfill}/>
		<path d="M15.25,15.5H4.75c-1.517,0-2.75-1.233-2.75-2.75V2.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75V12.75c0,.689,.561,1.25,1.25,1.25H15.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z" fill={fill}/>
	</g>
</svg>
	);
};

export default ChartTrendUp;