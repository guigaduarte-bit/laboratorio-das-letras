/** Ilustrações vetoriais originais, compartilhando a paleta da aventura. */
export function AnimalPortrait({ animal }: { animal: string })
{
    return <svg className="animal-portrait" viewBox="0 0 160 120" aria-hidden="true">
        <ellipse cx="80" cy="106" rx="52" ry="9" fill="#355f4b" opacity=".14" />
        {animal === 'sapo' && <g>
            <ellipse cx="44" cy="96" rx="23" ry="11" fill="#606c38" /><ellipse cx="116" cy="96" rx="23" ry="11" fill="#606c38" />
            <ellipse cx="80" cy="74" rx="44" ry="32" fill="#6f8a49" /><ellipse cx="80" cy="82" rx="27" ry="20" fill="#a8bc86" />
            {[54, 106].map((x) => <g key={x}><circle cx={x} cy="42" r="19" fill="#6f8a49" /><circle cx={x} cy="41" r="12" fill="#e8dcc7" /><circle cx={x+2} cy="42" r="5" fill="#26383a" /></g>)}
            <path d="M64 70 Q80 88 96 70" fill="none" stroke="#26383a" strokeWidth="3" strokeLinecap="round" />
        </g>}
        {animal === 'onca' && <g>
            <path d="M107 90 Q146 103 139 65" fill="none" stroke="#c08e3a" strokeWidth="13" strokeLinecap="round" />
            <ellipse cx="83" cy="79" rx="37" ry="28" fill="#e3bd57" /><rect x="51" y="86" width="17" height="20" rx="8" fill="#c08e3a" /><rect x="93" y="86" width="17" height="20" rx="8" fill="#c08e3a" />
            <circle cx="47" cy="33" r="14" fill="#c08e3a" /><circle cx="94" cy="33" r="14" fill="#c08e3a" /><circle cx="71" cy="52" r="34" fill="#e3bd57" />
            <ellipse cx="71" cy="64" rx="21" ry="15" fill="#e8dcc7" />
            {[[51,43],[91,43],[66,30],[79,30],[110,75],[88,89],[49,75]].map(([x,y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="4" fill="#355f4b" />)}
            <circle cx="58" cy="51" r="4" fill="#26383a" /><circle cx="84" cy="51" r="4" fill="#26383a" /><path d="M65 61 L77 61 L71 68Z" fill="#26383a" /><path d="M61 70 Q71 78 81 70" fill="none" stroke="#26383a" strokeWidth="2.5" />
        </g>}
        {animal === 'tucano' && <g>
            <path d="M48 73 L32 104 L67 96" fill="#26383a" /><ellipse cx="70" cy="70" rx="31" ry="34" fill="#26383a" />
            <ellipse cx="79" cy="71" rx="16" ry="24" fill="#e8dcc7" /><ellipse cx="56" cy="76" rx="15" ry="23" fill="#355f4b" />
            <circle cx="77" cy="40" r="26" fill="#26383a" /><path d="M91 27 Q142 24 149 55 Q119 64 91 53Z" fill="#e3bd57" /><path d="M137 32 Q148 40 149 55 L136 56Z" fill="#c66b3d" />
            <circle cx="81" cy="38" r="10" fill="#6faea4" /><circle cx="82" cy="38" r="5" fill="#26383a" /><circle cx="84" cy="36" r="2" fill="#e8dcc7" />
            <path d="M63 99 L60 107 M78 99 L81 107" stroke="#c08e3a" strokeWidth="5" strokeLinecap="round" />
        </g>}
        {animal === 'macaco' && <g>
            <path d="M105 83 C151 111 155 43 129 48 Q113 53 128 66" fill="none" stroke="#925b37" strokeWidth="12" strokeLinecap="round" />
            <ellipse cx="79" cy="80" rx="32" ry="27" fill="#925b37" /><ellipse cx="79" cy="82" rx="18" ry="19" fill="#d4b895" />
            <ellipse cx="50" cy="94" rx="12" ry="15" fill="#925b37" /><ellipse cx="104" cy="94" rx="12" ry="15" fill="#925b37" />
            <circle cx="39" cy="47" r="16" fill="#925b37" /><circle cx="111" cy="47" r="16" fill="#925b37" /><circle cx="39" cy="47" r="9" fill="#d4b895" /><circle cx="111" cy="47" r="9" fill="#d4b895" />
            <circle cx="75" cy="43" r="34" fill="#925b37" /><path d="M48 44 Q47 18 74 35 Q99 16 102 44 L99 62 Q74 86 50 62Z" fill="#d4b895" />
            <circle cx="62" cy="44" r="4" fill="#26383a" /><circle cx="88" cy="44" r="4" fill="#26383a" /><ellipse cx="75" cy="55" rx="5" ry="3" fill="#26383a" /><path d="M63 63 Q75 75 87 63" fill="none" stroke="#26383a" strokeWidth="3" strokeLinecap="round" />
        </g>}
    </svg>;
}
