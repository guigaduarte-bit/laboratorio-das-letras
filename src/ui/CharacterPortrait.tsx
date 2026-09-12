import type { CharacterId } from '../game/content/characters';

/** Small original portraits, matching the playable 3D silhouettes and their colours. */
export function CharacterPortrait({ character }: { character: CharacterId }) {
    return <svg className="character-portrait" viewBox="0 0 160 132" aria-hidden="true" focusable="false">
        <ellipse cx="80" cy="119" rx="47" ry="8" fill="#355f4b" opacity=".13" />
        {character === 'lumi' && <g>
            <path d="M53 80L40 91M107 80L121 68" fill="none" stroke="#355d54" strokeWidth="12" strokeLinecap="round" />
            <path d="M40 88L37 96M121 68L126 58" fill="none" stroke="#f4ecd7" strokeWidth="12" strokeLinecap="round" />
            <circle cx="127" cy="55" r="7" fill="#355d54" />
            <path d="M64 100V111M96 100V111" stroke="#355d54" strokeWidth="13" strokeLinecap="round" />
            <rect x="52" y="108" width="25" height="13" rx="6" fill="#e9bd58" /><rect x="84" y="108" width="25" height="13" rx="6" fill="#e9bd58" />
            <rect x="54" y="73" width="53" height="31" rx="13" fill="#7eaca0" />
            <path d="M57 96H104M56 89H104" stroke="#e9bd58" strokeWidth="6" strokeLinecap="round" />
            <rect x="38" y="31" width="85" height="48" rx="19" fill="#7eaca0" />
            <rect x="43" y="36" width="75" height="38" rx="13" fill="#f4ecd7" /><rect x="49" y="41" width="63" height="28" rx="10" fill="#163235" />
            <ellipse cx="65" cy="54" rx="5" ry="7" fill="#ffdb7d" /><ellipse cx="96" cy="54" rx="5" ry="7" fill="#ffdb7d" />
            <path d="M75 63Q81 68 87 63" fill="none" stroke="#ffdb7d" strokeWidth="2" strokeLinecap="round" />
            <path d="M90 31L95 16" stroke="#355d54" strokeWidth="4" strokeLinecap="round" /><circle cx="96" cy="14" r="7" fill="#e9bd58" />
            <circle cx="122" cy="55" r="6" fill="#355d54" /><circle cx="37" cy="55" r="6" fill="#355d54" />
        </g>}
        {character === 'unicorn' && <g>
            <path d="M112 81Q139 85 127 106" fill="none" stroke="#c7a2ca" strokeWidth="14" strokeLinecap="round" /><path d="M112 83Q131 87 123 105" fill="none" stroke="#92c7b4" strokeWidth="5" strokeLinecap="round" />
            <path d="M70 92L64 113M102 94L109 113M55 93L46 110M85 94L84 113" stroke="#f8efdf" strokeWidth="13" strokeLinecap="round" />
            <path d="M59 116H67M105 116H112M41 113H48M80 116H87" stroke="#c7a2ca" strokeWidth="8" strokeLinecap="round" />
            <ellipse cx="85" cy="84" rx="34" ry="23" fill="#f8efdf" /><path d="M70 80Q59 60 58 49" fill="none" stroke="#f8efdf" strokeWidth="29" strokeLinecap="round" />
            <path d="M73 35Q89 46 78 66L84 78" fill="none" stroke="#c7a2ca" strokeWidth="15" strokeLinecap="round" /><path d="M74 43Q87 50 79 61" fill="none" stroke="#92c7b4" strokeWidth="6" strokeLinecap="round" />
            <path d="M50 37L48 18Q63 19 66 36" fill="#f8efdf" /><path d="M52 30L51 23L61 33" fill="#e6aaa7" />
            <path d="M69 35L85 9L84 41Z" fill="#e9bd58" /><path d="M76 26L83 29M72 33L84 36" stroke="#c89437" strokeWidth="2" />
            <ellipse cx="58" cy="48" rx="25" ry="24" fill="#f8efdf" /><ellipse cx="43" cy="63" rx="24" ry="15" fill="#fff2d9" />
            <ellipse cx="53" cy="45" rx="4" ry="6" fill="#273a3b" /><circle cx="52" cy="43" r="1.5" fill="#fff" /><ellipse cx="29" cy="62" rx="2" ry="3" fill="#c7a2ca" />
            <path d="M28 69Q34 73 40 70" fill="none" stroke="#ad879f" strokeWidth="2" strokeLinecap="round" />
            <path d="M66 31Q80 27 78 40" fill="none" stroke="#e6aaa7" strokeWidth="11" strokeLinecap="round" />
            <path d="M95 7L98 14L105 17L98 20L95 27L92 20L85 17L92 14Z" fill="#e9bd58" opacity=".7" />
        </g>}
        {character === 'dog' && <g>
            <path d="M111 87Q139 83 133 63" fill="none" stroke="#c68a50" strokeWidth="13" strokeLinecap="round" /><path d="M134 65L133 61" stroke="#fff2d9" strokeWidth="12" strokeLinecap="round" />
            <ellipse cx="84" cy="86" rx="34" ry="25" fill="#c68a50" />
            <path d="M101 95L106 113M79 98L78 113M53 90L49 109" stroke="#c68a50" strokeWidth="14" strokeLinecap="round" />
            <path d="M100 116H111M72 116H83M42 112H53" stroke="#fff2d9" strokeWidth="9" strokeLinecap="round" />
            <path d="M58 88L40 75L34 66" fill="none" stroke="#c68a50" strokeWidth="13" strokeLinecap="round" /><ellipse cx="31" cy="61" rx="9" ry="10" fill="#fff2d9" />
            <path d="M48 73L75 69L64 91Z" fill="#92c7b4" />
            <ellipse cx="58" cy="47" rx="32" ry="28" fill="#c68a50" />
            <ellipse cx="32" cy="47" rx="12" ry="25" fill="#875c3d" transform="rotate(15 32 47)" /><ellipse cx="84" cy="48" rx="12" ry="24" fill="#875c3d" transform="rotate(-15 84 48)" />
            <ellipse cx="49" cy="47" rx="11" ry="14" fill="#875c3d" /><ellipse cx="56" cy="61" rx="24" ry="15" fill="#fff2d9" />
            <ellipse cx="47" cy="45" rx="4" ry="6" fill="#273a3b" /><ellipse cx="69" cy="45" rx="4" ry="6" fill="#273a3b" /><circle cx="46" cy="43" r="1.5" fill="#fff" /><circle cx="68" cy="43" r="1.5" fill="#fff" />
            <path d="M50 55Q57 51 64 55Q65 62 57 64Q50 62 50 55Z" fill="#273a3b" />
            <path d="M50 66Q57 73 65 66" fill="none" stroke="#273a3b" strokeWidth="2" strokeLinecap="round" /><path d="M56 70Q57 82 63 73L63 69" fill="#e6aaa7" />
        </g>}
    </svg>;
}
