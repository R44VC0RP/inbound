import React, {SVGProps} from 'react';

type IconProps = SVGProps<SVGSVGElement> & {
	secondaryfill?: string;
	strokewidth?: number;
	title?: string;
}

function Download2({fill = 'currentColor', secondaryfill, title = 'badge 13', ...props}: IconProps) {
	secondaryfill = secondaryfill || fill;

	return (
		<svg height="18" width="18" {...props} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M13.75,2.5h-1.5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h1.5c.689,0,1.25,.561,1.25,1.25v7.5c0,.689-.561,1.25-1.25,1.25H4.25c-.689,0-1.25-.561-1.25-1.25V5.25c0-.689,.561-1.25,1.25-1.25h1.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-1.5c-1.517,0-2.75,1.233-2.75,2.75v7.5c0,1.517,1.233,2.75,2.75,2.75H13.75c1.517,0,2.75-1.233,2.75-2.75V5.25c0-1.517-1.233-2.75-2.75-2.75Z" fill={fill}/>
		<path d="M5.47,8.22c-.293,.293-.293,.768,0,1.061l3,3c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l3-3c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0l-1.72,1.72V3.25c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v6.689l-1.72-1.72c-.293-.293-.768-.293-1.061,0Z" fill={secondaryfill}/>
	</g>
</svg>
	);
};

export default Download2;