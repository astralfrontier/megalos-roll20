function clearExistingRows(name: string) {
  getSectionIDs(`repeating_${name}`, function (idarray) {
    for (let id of idarray) {
      removeRepeatingRow(`repeating_${name}_${id}`)
    }
  })
}

on('clicked:jsonimport', function () {
  getAttrs(['jsonimport'], (v) => {
    const character = JSON.parse(v['jsonimport'])

    clearExistingRows('bonds')
    clearExistingRows('inventory')
    clearExistingRows('powers')
    clearExistingRows('skills')

    const O: any = {}

    // Take us back to page 1 when import finishes
    O['sheetTab'] = 'page1'

    // Clear the import field
    O['jsonimport'] = ''

    // Profile
    // O['character_name'] = character.name
    O['homeland'] = character.homeland.name
    // O['pronouns'] = character.pronouns
    O['class'] = character.class.name
    O['calling'] = character.calling.name
    O['role'] = character.calling.role

    // Bonds
    O[`repeating_bonds_${generateRowID()}_bondname`] = '(write a new bond)'

    // Weapon
    O['weapon_name'] = character.weapon.weaponName
    O['weapon_desc'] = character.weapon.weaponDesc
    O['weapon_auto_attack'] = `${character.calling.benefits.baseDamage}`
    O['weapon_core_damage'] = `${
      character.calling.benefits.baseDamage + character.weapon.finalDamageBonus
    }`
    O['weapon_range'] = character.weapon.finalRange
    O['weapon_dice'] = character.weapon.finalWeaponDice

    // Armor
    O['armor_name'] = character.armor.outfitName
    O['armor_desc'] = character.armor.outfitDesc
    O['armor_dodge'] = `${
      character.calling.benefits.baseDodge +
      character.armor.finalDefenseBonus +
      character.armor.dodgeBonus
    }`
    O['armor_ward'] = `${
      character.calling.benefits.baseWard +
      character.armor.finalDefenseBonus +
      character.armor.wardBonus
    }`

    // Soak
    O['soak_physical'] = `${
      character.armor.finalSoakBonus + character.armor.physicalSoak
    }`
    O['soak_astral'] = `${
      character.armor.finalSoakBonus + character.armor.astralSoak
    }`
    O['soak_umbral'] = `${
      character.armor.finalSoakBonus + character.armor.umbralSoak
    }`
    O['soak_toxic'] = `${
      character.armor.finalSoakBonus + character.armor.toxicSoak
    }`

    // HP, AHP, Recovery, RB
    O['hp'] = character.calling.benefits.baseHp
    O['hp_max'] = character.calling.benefits.baseHp
    O['armor_hp'] = `${character.armor.finalArmorHP}`
    O['armor_hp_max'] = `${character.armor.finalArmorHP}`
    O['recovery'] = character.calling.benefits.recovery
    O['recovery_max'] = character.calling.benefits.recovery
    O['rb'] = Math.ceil(character.calling.benefits.baseHp / 4)

    // Skills
    for (let skill of character.skills) {
      const row = generateRowID()
      O[`repeating_skills_${row}_skillname`] = skill.skill
      O[`repeating_skills_${row}_skillrank`] = skill.effectiveRank
    }

    // Traits
    O['talent_background'] = character.traits.background
    O['talent_physical'] = character.traits.physical
    O['talent_mental'] = character.traits.mental
    O['talent_special'] = character.traits.special

    // Inventory
    O['ip'] = `${character.armor.finalInventoryPoints}`
    O['ip_max'] = `${character.armor.finalInventoryPoints}`

    // Aether Current
    O['aether_current'] = character.class.aetherCurrentRules.join('\n')

    // Powers
    for (let power of character.powers) {
      const row = generateRowID()
      O[`repeating_powers_${row}_powername`] = power.name
      O[`repeating_powers_${row}_powertype`] = power.type
      O[`repeating_powers_${row}_powerdesc`] = power.description.join('')
    }

    setAttrs(O)
  })
})
