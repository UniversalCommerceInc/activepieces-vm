import tinycolor from 'tinycolor2'

function generateColorVariations(defaultColor: string) {
    const defaultColorObj = tinycolor(defaultColor)

    const darkColor = defaultColorObj.clone().darken(2)
    const baseLight = tinycolor('#ffffff')
    const lightColor = tinycolor
        .mix(baseLight, defaultColorObj.toHex(), 12)
        .toHexString()
    const mediumColor = defaultColorObj.clone().lighten(26)

    return {
        default: defaultColorObj.toHexString(),
        dark: darkColor.toHexString(),
        light: lightColor,
        medium: mediumColor.toHexString(),
    }
}

function generateSelectionColor(defaultColor: string) {
    const defaultColorObj = tinycolor(defaultColor)
    const lightColor = defaultColorObj.lighten(8)
    return lightColor.toHexString()
}

export function generateTheme({
    primaryColor,
    fullLogoUrl,
    favIconUrl,
    logoIconUrl,
    websiteName,
}: {
    primaryColor: string
    fullLogoUrl: string
    favIconUrl: string
    logoIconUrl: string
    websiteName: string
}) {
    return {
        websiteName,
        colors: {
            avatar: '#515151',
            'blue-link': '#1890ff',
            danger: '#f94949',
            primary: generateColorVariations(primaryColor),
            warn: {
                default: '#f78a3b',
                light: '#fff6e4',
                dark: '#cc8805',
            },
            success: {
                default: '#14ae5c',
                light: '#3cad71',
            },
            selection: generateSelectionColor(primaryColor),
        },
        logos: {
            fullLogoUrl,
            favIconUrl,
            logoIconUrl,
        },
    }
}

export const defaultTheme = generateTheme({
    primaryColor: '#6e41e2',
    websiteName: 'UNIVERSAL COMMERCE',
    fullLogoUrl: 'https://marketplace.commercetools.com/img/containers/assets/integrations/universalcommerce/stage-logo-universal_commerce.png/6974a4a604871e80c96a19ac79fe9e99.png',
    favIconUrl: 'https://marketplace.commercetools.com/img/containers/assets/integrations/universalcommerce/stage-logo-universal_commerce.png/6974a4a604871e80c96a19ac79fe9e99.png',
    logoIconUrl: 'https://marketplace.commercetools.com/img/containers/assets/integrations/universalcommerce/stage-logo-universal_commerce.png/6974a4a604871e80c96a19ac79fe9e99.png',
})
