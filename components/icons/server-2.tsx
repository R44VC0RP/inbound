import React, {SVGProps} from 'react';

type IconProps = SVGProps<SVGSVGElement> & {
	secondaryfill?: string;
	strokewidth?: number;
	title?: string;
}

function Server2({fill = 'currentColor', secondaryfill, title = 'badge 13', ...props}: IconProps) {
	secondaryfill = secondaryfill || fill;

	return (
		<svg height="12" width="12" {...props} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="m9.75,0H2.25C1.01,0,0,1.009,0,2.25v1c0,1.241,1.01,2.25,2.25,2.25h7.5c1.24,0,2.25-1.009,2.25-2.25v-1c0-1.241-1.01-2.25-2.25-2.25ZM3,3.75c-.552,0-1-.448-1-1s.448-1,1-1,1,.448,1,1-.448,1-1,1Zm3,0c-.552,0-1-.448-1-1s.448-1,1-1,1,.448,1,1-.448,1-1,1Z" fill={fill} strokeWidth="0"/>
		<path d="m9.75,6.5H2.25c-1.24,0-2.25,1.009-2.25,2.25v1c0,1.241,1.01,2.25,2.25,2.25h7.5c1.24,0,2.25-1.009,2.25-2.25v-1c0-1.241-1.01-2.25-2.25-2.25Zm-6.75,3.75c-.552,0-1-.448-1-1s.448-1,1-1,1,.448,1,1-.448,1-1,1Zm3,0c-.552,0-1-.448-1-1s.448-1,1-1,1,.448,1,1-.448,1-1,1Z" fill={secondaryfill} strokeWidth="0"/>
	</g>
</svg>
	);
};

export default Server2;