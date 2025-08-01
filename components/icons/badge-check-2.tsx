import React, {SVGProps} from 'react';

type IconProps = SVGProps<SVGSVGElement> & {
	secondaryfill?: string;
	strokewidth?: number;
	title?: string;
}

function BadgeCheck2({fill = 'currentColor', secondaryfill, title = 'badge 13', ...props}: IconProps) {
	secondaryfill = secondaryfill || fill;

	return (
		<svg height="18" width="18" {...props} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M16.249,7.763s0,0,0,0l-1.248-1.248v-1.765c0-.965-.785-1.75-1.75-1.75h-1.765l-1.249-1.249c-.681-.68-1.791-.681-2.474,0l-1.248,1.248h-1.765c-.965,0-1.75,.785-1.75,1.75v1.765l-1.249,1.249c-.681,.682-.681,1.792,0,2.474l1.248,1.248v1.765c0,.965,.785,1.75,1.75,1.75h1.765l1.249,1.249c.341,.34,.789,.511,1.237,.511s.896-.17,1.237-.511l1.248-1.248h1.765c.965,0,1.75-.785,1.75-1.75v-1.765l1.249-1.249c.681-.682,.681-1.792,0-2.474Zm-3.784-.8l-3.923,5c-.136,.174-.343,.279-.564,.287-.009,0-.017,0-.026,0-.212,0-.414-.089-.557-.247l-1.827-2.023c-.277-.308-.253-.782,.054-1.06,.307-.277,.782-.253,1.06,.054l1.23,1.362,3.374-4.299c.256-.326,.727-.383,1.053-.127,.326,.255,.383,.727,.127,1.053Z" fill={fill}/>
	</g>
</svg>
	);
};

export default BadgeCheck2;