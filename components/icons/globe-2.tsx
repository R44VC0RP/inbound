import React, {SVGProps} from 'react';

type IconProps = SVGProps<SVGSVGElement> & {
	secondaryfill?: string;
	strokewidth?: number;
	title?: string;
}

function Globe2({fill = 'currentColor', secondaryfill, title = 'badge 13', ...props}: IconProps) {
	secondaryfill = secondaryfill || fill;

	return (
		<svg height="18" width="18" {...props} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M16.25,8.25h-3.517c-.157-3.641-1.454-7.25-3.733-7.25s-3.576,3.609-3.733,7.25H1.75v1.5h3.517c.157,3.641,1.454,7.25,3.733,7.25s3.576-3.609,3.733-7.25h3.517v-1.5ZM9,2.5c.858,0,2.079,2.216,2.233,5.75H6.767c.154-3.534,1.375-5.75,2.233-5.75Zm0,13c-.858,0-2.079-2.216-2.233-5.75h4.467c-.154,3.534-1.375,5.75-2.233,5.75Z" fill={secondaryfill}/>
		<path d="M9,17c-4.411,0-8-3.589-8-8S4.589,1,9,1s8,3.589,8,8-3.589,8-8,8Zm0-14.5c-3.584,0-6.5,2.916-6.5,6.5s2.916,6.5,6.5,6.5,6.5-2.916,6.5-6.5-2.916-6.5-6.5-6.5Z" fill={fill}/>
	</g>
</svg>
	);
};

export default Globe2;