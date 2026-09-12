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
        {animal === 'preguica' && <g>
            <ellipse cx="80" cy="78" rx="29" ry="29" fill="#96816b" /><ellipse cx="80" cy="80" rx="18" ry="22" fill="#c9b89a" />
            <path d="M54 64 Q34 77 43 96 M106 64 Q134 72 124 44" fill="none" stroke="#96816b" strokeWidth="17" strokeLinecap="round" />
            <ellipse cx="61" cy="101" rx="16" ry="8" fill="#96816b" /><ellipse cx="99" cy="101" rx="16" ry="8" fill="#96816b" />
            {[55,62,69,92,99,106].map((x) => <path key={x} d={`M${x} 103 v5`} stroke="#f8f0d9" strokeWidth="4" strokeLinecap="round" />)}
            {[119,125,131].map((x) => <path key={x} d={`M${x} 42 v-8`} stroke="#f8f0d9" strokeWidth="4" strokeLinecap="round" />)}
            <ellipse cx="79" cy="41" rx="37" ry="31" fill="#96816b" /><ellipse cx="79" cy="43" rx="31" ry="26" fill="#e1d2b4" />
            <path d="M49 48 L66 36 Q73 33 73 41 Q73 48 54 56Z M109 48 L92 36 Q85 33 85 41 Q85 48 104 56Z" fill="#5b493b" />
            <circle cx="65" cy="42" r="3.5" fill="#26383a" /><circle cx="93" cy="42" r="3.5" fill="#26383a" />
            <ellipse cx="79" cy="49" rx="6" ry="4" fill="#26383a" /><path d="M67 56 Q79 65 91 56" fill="none" stroke="#26383a" strokeWidth="2.5" strokeLinecap="round" />
        </g>}
        {animal === 'sucuri' && <g>
            <ellipse cx="79" cy="91" rx="48" ry="18" fill="#879a50" /><ellipse cx="79" cy="87" rx="29" ry="8" fill="#586c3c" />
            <path d="M119 93 C143 74 88 61 48 77 C17 93 56 105 97 96 C130 87 102 76 78 81" fill="none" stroke="#879a50" strokeWidth="16" strokeLinecap="round" />
            <path d="M39 87 Q49 103 96 94 M50 78 Q90 66 116 83 Q113 89 104 90" fill="none" stroke="#657d41" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M78 84 Q104 78 100 58 Q97 48 84 47" fill="none" stroke="#879a50" strokeWidth="21" strokeLinecap="round" />
            {[[42,86],[54,98],[92,98],[116,81],[66,78]].map(([x,y]) => <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="5" ry="3" fill="#586c3c" />)}
            <ellipse cx="78" cy="37" rx="29" ry="22" fill="#879a50" /><ellipse cx="77" cy="48" rx="24" ry="10" fill="#d6d9a3" />
            {[64,91].map((x) => <g key={x}><circle cx={x} cy="32" r="7" fill="#e3bd57" /><circle cx={x} cy="32" r="3.5" fill="#26383a" /><circle cx={x-1} cy="30.5" r="1" fill="#f8f0d9" /></g>)}
            <circle cx="72" cy="43" r="1.5" fill="#586c3c" /><circle cx="83" cy="43" r="1.5" fill="#586c3c" />
            <path d="M64 48 Q78 57 91 48" fill="none" stroke="#26383a" strokeWidth="2.5" strokeLinecap="round" />
        </g>}
        {animal === 'capivara' && <g>
            <ellipse cx="76" cy="76" rx="45" ry="29" fill="#a77d53" />
            <rect x="39" y="88" width="18" height="19" rx="8" fill="#775a41" /><rect x="91" y="88" width="18" height="19" rx="8" fill="#775a41" />
            <ellipse cx="91" cy="49" rx="35" ry="28" fill="#a77d53" /><ellipse cx="102" cy="61" rx="33" ry="21" fill="#bc9467" />
            <ellipse cx="70" cy="27" rx="9" ry="11" fill="#a77d53" /><ellipse cx="105" cy="25" rx="8" ry="10" fill="#a77d53" />
            <ellipse cx="70" cy="27" rx="4" ry="6" fill="#d6b68c" /><ellipse cx="105" cy="25" rx="4" ry="5" fill="#d6b68c" />
            <circle cx="81" cy="43" r="3.5" fill="#26383a" /><circle cx="112" cy="42" r="3.5" fill="#26383a" />
            <ellipse cx="115" cy="58" rx="3" ry="2" fill="#654e3c" /><ellipse cx="126" cy="58" rx="3" ry="2" fill="#654e3c" />
            <path d="M96 68 Q111 76 125 68" fill="none" stroke="#654e3c" strokeWidth="2.5" strokeLinecap="round" />
        </g>}
        {animal === 'arara' && <g>
            <path d="M71 81 L41 111 L66 106 L84 81" fill="#397ead" /><path d="M74 82 L59 112 L77 105 L86 81" fill="#cb5945" />
            <ellipse cx="81" cy="71" rx="29" ry="30" fill="#cb5945" />
            <path d="M61 53 Q35 47 29 76 L51 82 L65 70 M104 54 Q128 47 136 76 L114 82 L101 71" fill="#cb5945" />
            <path d="M34 67 L54 72 L53 83 L27 82 M110 71 L133 66 L139 81 L116 85" fill="#e3bd57" />
            <path d="M29 79 L54 80 L56 94 L43 91 L35 87 L29 91 L23 85Z M115 80 L138 78 L143 85 L136 91 L130 87 L118 94Z" fill="#397ead" />
            <circle cx="83" cy="36" r="25" fill="#cb5945" /><ellipse cx="95" cy="37" rx="15" ry="18" fill="#f8f0d9" />
            <circle cx="96" cy="31" r="4" fill="#26383a" /><path d="M88 40 h11 M89 45 h9" stroke="#cb5945" strokeWidth="2" strokeLinecap="round" />
            <path d="M107 30 Q134 30 128 55 Q122 66 115 58 L116 43 L106 44Z" fill="#d4c8aa" /><path d="M125 39 Q135 56 118 64 L115 53Z" fill="#26383a" />
            <path d="M76 98 L72 107 M91 98 L94 107" stroke="#6b6960" strokeWidth="5" strokeLinecap="round" />
        </g>}
    </svg>;
}
