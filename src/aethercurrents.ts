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
