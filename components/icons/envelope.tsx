import React, {SVGProps} from 'react';

type IconProps = SVGProps<SVGSVGElement> & {
	secondaryfill?: string;
	strokewidth?: number;
	title?: string;
}

function Envelope({fill = 'currentColor', secondaryfill, title = 'badge 13', ...props}: IconProps) {
	secondaryfill = secondaryfill || fill;

	return (
		<svg height="18" width="18" {...props} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M1 5.25C1 3.73079 2.23079 2.5 3.75 2.5H14.25C15.7692 2.5 17 3.73079 17 5.25V12.75C17 14.2692 15.7692 15.5 14.25 15.5H3.75C2.23079 15.5 1 14.2692 1 12.75V5.25Z" fill={secondaryfill} fillOpacity="0.4" fillRule="evenodd"/>
		<path d="M3.75 2.5C2.23054 2.5 1 3.73203 1 5.25C1 5.52318 1.14853 5.77475 1.38773 5.9067L8.15473 9.6397C8.68119 9.93004 9.31874 9.93008 9.84519 9.63975L16.6123 5.9067C16.8515 5.77475 17 5.52318 17 5.25C17 3.73203 15.7695 2.5 14.25 2.5H3.75Z" fill={fill} fillRule="evenodd"/>
	</g>
</svg>
	);
};

export default Envelope;