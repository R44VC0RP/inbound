import React, {SVGProps} from 'react';

type IconProps = SVGProps<SVGSVGElement> & {
	secondaryfill?: string;
	strokewidth?: number;
	title?: string;
}

function ChevronLeft({fill = 'currentColor', secondaryfill, title = 'badge 13', ...props}: IconProps) {
	secondaryfill = secondaryfill || fill;

	return (
		<svg height="18" width="18" {...props} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M11.5,16c-.192,0-.384-.073-.53-.22l-6.25-6.25c-.293-.293-.293-.768,0-1.061L10.97,2.22c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061l-5.72,5.72,5.72,5.72c.293,.293,.293,.768,0,1.061-.146,.146-.338,.22-.53,.22Z" fill={fill}/>
	</g>
</svg>
	);
};

export default ChevronLeft;