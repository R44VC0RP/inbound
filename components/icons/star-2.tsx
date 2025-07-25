import React, {SVGProps} from 'react';

type IconProps = SVGProps<SVGSVGElement> & {
	secondaryfill?: string;
	strokewidth?: number;
	title?: string;
}

function Star2({fill = 'currentColor', secondaryfill, title = 'badge 13', ...props}: IconProps) {
	secondaryfill = secondaryfill || fill;

	return (
		<svg height="18" width="18" {...props} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M16.25,6.5h-5.029l-1.506-4.728c-.099-.311-.388-.522-.715-.522s-.616,.211-.715,.522l-1.506,4.728H1.75c-.321,0-.607,.205-.71,.509-.104,.304-.001,.641,.253,.836l4.011,3.08-1.577,4.843c-.101,.309,.009,.647,.271,.839,.262,.191,.619,.192,.881,0l4.12-2.986,4.12,2.986c.131,.095,.286,.143,.44,.143s.31-.048,.441-.144c.263-.191,.373-.53,.271-.839l-1.577-4.843,4.011-3.08c.255-.195,.357-.532,.253-.836-.103-.304-.389-.509-.71-.509Z" fill={fill}/>
	</g>
</svg>
	);
};

export default Star2;