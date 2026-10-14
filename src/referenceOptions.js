// Library-only designs retain their representative model geometry.
export const referenceOptions=[
  {
    "key": "setting",
    "value": "Eight prong",
    "id": "settings-eight-prong"
  },
  {
    "key": "setting",
    "value": "Claw prong",
    "id": "settings-claw-prong"
  },
  {
    "key": "setting",
    "value": "Double claw",
    "id": "settings-double-claw"
  },
  {
    "key": "setting",
    "value": "Rounded prong",
    "id": "settings-rounded-prong"
  },
  {
    "key": "setting",
    "value": "V-prong",
    "id": "settings-v-prong"
  },
  {
    "key": "setting",
    "value": "Partial bezel",
    "id": "settings-partial-bezel"
  },
  {
    "key": "setting",
    "value": "Basket",
    "id": "settings-basket"
  },
  {
    "key": "setting",
    "value": "Cathedral",
    "id": "settings-cathedral"
  },
  {
    "key": "setting",
    "value": "Peg head",
    "id": "settings-peg-head"
  },
  {
    "key": "setting",
    "value": "Trellis",
    "id": "settings-trellis"
  },
  {
    "key": "setting",
    "value": "Tension-style",
    "id": "settings-tension-style"
  },
  {
    "key": "setting",
    "value": "Flush",
    "id": "settings-flush"
  },
  {
    "key": "layout",
    "value": "Cluster",
    "id": "layouts-cluster"
  },
  {
    "key": "layout",
    "value": "Toi et moi",
    "id": "layouts-toi-et-moi"
  },
  {
    "key": "layout",
    "value": "Side-stone",
    "id": "layouts-side-stone"
  },
  {
    "key": "layout",
    "value": "Half eternity",
    "id": "layouts-half-eternity"
  },
  {
    "key": "layout",
    "value": "Three-quarter eternity",
    "id": "layouts-three-quarter-eternity"
  },
  {
    "key": "layout",
    "value": "Full eternity",
    "id": "layouts-full-eternity"
  },
  {
    "key": "layout",
    "value": "East-west",
    "id": "layouts-east-west"
  },
  {
    "key": "layout",
    "value": "North-south",
    "id": "layouts-north-south"
  },
  {
    "key": "layout",
    "value": "Bypass",
    "id": "layouts-bypass"
  },
  {
    "key": "layout",
    "value": "Asymmetric",
    "id": "layouts-asymmetric"
  }
];
export const settingStyles=["4 prong","6 prong","Bezel","Eight prong","Claw prong","Double claw","Rounded prong","V-prong","Partial bezel","Basket","Cathedral","Peg head","Trellis","Tension-style","Flush"];
export const primaryChoices={band:['Rounded','Flat','Tapered','Split shank'],accents:['None','Pave','Channel','Bezel accents'],layout:['Solitaire','Three-stone','Halo'],setting:['4 prong','6 prong','Bezel']};
export function referenceModel(config){return referenceOptions.find(r=>r.key==='layout'&&r.value===config.layout)??referenceOptions.find(r=>r.key==='setting'&&r.value===config.setting);}
