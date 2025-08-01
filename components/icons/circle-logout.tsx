import React, {SVGProps} from 'react';

type IconProps = SVGProps<SVGSVGElement> & {
	secondaryfill?: string;
	strokewidth?: number;
	title?: string;
}

function CircleLogout({fill = 'currentColor', secondaryfill, title = 'badge 13', ...props}: IconProps) {
	secondaryfill = secondaryfill || fill;

	return (
		<svg height="18" width="18" {...props} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M11.25,2.75c-3.192,0-5.828,2.407-6.201,5.5h6.201c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75H5.049c.372,3.093,3.009,5.5,6.201,5.5,3.446,0,6.25-2.804,6.25-6.25s-2.804-6.25-6.25-6.25Z" fill={fill}/>
		<path d="M2.561,9.75h2.489c-.03-.246-.049-.496-.049-.75s.02-.504,.049-.75H2.561l1.22-1.22c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0L.22,8.47c-.293,.293-.293,.768,0,1.061l2.5,2.5c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-1.22-1.22Z" fill={secondaryfill}/>
	</g>
</svg>
	);
};

export default CircleLogout;