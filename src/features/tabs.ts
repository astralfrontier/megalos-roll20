// Cleverly use HTML attributes so we can support any number of tabbed elements on the sheet

on(`clicked:changetab`, function (event) {
  const tabattr = event.htmlAttributes['data-tab-attr']
  const tabvalue = event.htmlAttributes['data-tab']
  console.log(`Got tabattr=${tabattr} and tabvalue=${tabvalue}`)
  const O: any = {}
  O[tabattr] = tabvalue
  setAttrs(O)
})
