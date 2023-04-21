const STATUS_LIST: string[] = [
  'afraid',
  'agony',
  'dazed',
  'exposed',
  'immobilized',
  'sick',
  'slowed',
  'stunned',
  'taunted',
  'wounded',
].map((name) => `status_save_${name}`)

const CONDITION_LIST: string[] = [
  'blink',
  'cloaked',
  'cover',
  'empowered',
  'focused',
  'haste',
  'regen',
  'shielded',
].map((name) => `condition_${name}`)

function statusConditionNameWithStacks(
  attribute: string,
  prefix: string,
  v: AttributeBundle
): string {
  const nameWithoutPrefix = attribute.replace(prefix, '')
  const stacksName = `stacks_${nameWithoutPrefix}`
  let suffix = ''
  if (v[stacksName]) {
    suffix = ` [${v[stacksName]}]`
  }
  return `${nameWithoutPrefix.toUpperCase()}${suffix}`
}

function update_tracker(
  attributes: string[],
  tracker: string,
  prefix: string,
  message: string
) {
  getAttrs(attributes, (v) => {
    const O: any = {}
    O[tracker] =
      attributes
        .filter((attr) => attr.startsWith(prefix))
        .map((name): [string, number] => [
          statusConditionNameWithStacks(name, prefix, v),
          parseInt(v[name]),
        ])
        .filter((tuple) => tuple[1] > 0)
        .map((tuple) => ` {{${tuple[0]}=(${tuple[1]})}}`)
        .join('') || ` {{text=${message}}}`
    setAttrs(O)
  })
}

function update_status_tracker() {
  update_tracker(
    [...STATUS_LIST, 'stacks_wounded'],
    'status_tracker',
    'status_save_',
    'No Statuses'
  )
}

function update_condition_tracker() {
  update_tracker(
    [...CONDITION_LIST, 'stacks_regen'],
    'condition_tracker',
    'condition_',
    'No Conditions'
  )
}

on(
  `change:stacks_wounded ${STATUS_LIST.map((attr) => `change:${attr}`).join(
    ' '
  )}`,
  update_status_tracker
)

on(
  `change:stacks_regen ${CONDITION_LIST.map((attr) => `change:${attr}`).join(
    ' '
  )}`,
  update_condition_tracker
)

const aethercurrents_attributes = [
  'unlock_ac5',
  ...[1, 2, 3, 4, 5].map((n) => `aether_current_${n}`),
]
on(aethercurrents_attributes.map((s) => `change:${s}`).join(' '), (event) => {
  const attr = event.sourceAttribute || ''
  getAttrs(aethercurrents_attributes, (v) => {
    const output: AttributeBundle = {}
    const throne_damage = Object.keys(v).reduce(
      (total, key) => total + (v[key] == 'Throne Damage' ? 1 : 0),
      0
    )
    output['throne_damage'] = `${throne_damage}`
    getSectionIDs('repeating_powers', (idarray) => {
      // Update
      idarray.forEach((id) => {
        output[`repeating_powers_${id}_${attr}`] = v[attr]
      })
      setAttrs(output)
    })
  })
})