import React, {SVGProps} from 'react';

type IconProps = SVGProps<SVGSVGElement> & {
	secondaryfill?: string;
	strokewidth?: number;
	title?: string;
}

function Calendar2({fill = 'currentColor', secondaryfill, title = 'badge 13', ...props}: IconProps) {
	secondaryfill = secondaryfill || fill;

	return (
		<svg height="12" width="12" {...props} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<circle cx="4" cy="7" fill={secondaryfill} r="1" strokeWidth="0"/>
		<path d="m9,1.525v-.775c0-.414-.336-.75-.75-.75s-.75.336-.75.75v.75h-3v-.75c0-.414-.336-.75-.75-.75s-.75.336-.75.75v.775c-1.398.129-2.5,1.294-2.5,2.725v5c0,1.517,1.233,2.75,2.75,2.75h5.5c1.517,0,2.75-1.233,2.75-2.75v-5c0-1.431-1.102-2.596-2.5-2.725Zm1,7.725c0,.689-.561,1.25-1.25,1.25H3.25c-.689,0-1.25-.561-1.25-1.25v-4.25h8v4.25Z" fill={fill} strokeWidth="0"/>
	</g>
</svg>
	);
};

export default Calendar2;