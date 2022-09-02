const got = require('got');

module.exports = {
    name: 'epicgames',
    description: 'Search a game on Epic Games',
    aliases: ['epic'],
    cooldown: 5,
    usage: '<game name>',
    async execute(client, msg, utils) {
        if (!msg.args.length) return { text: `you need to provide a game name to search`, reply: true }
        const game = msg.args.join(' ')

        const { body } = await got.post(`https://www.epicgames.com/graphql`, {
            responseType: 'json',
            json: {
                "query": "query searchStoreQuery($allowCountries: String, $category: String, $count: Int, $country: String!, $keywords: String, $locale: String, $namespace: String, $itemNs: String, $sortBy: String, $sortDir: String, $start: Int, $tag: String, $releaseDate: String, $withPrice: Boolean = false, $withPromotions: Boolean = false, $priceRange: String, $freeGame: Boolean, $onSale: Boolean, $effectiveDate: String) {\n  Catalog {\n    searchStore(\n      allowCountries: $allowCountries\n      category: $category\n      count: $count\n      country: $country\n      keywords: $keywords\n      locale: $locale\n      namespace: $namespace\n      itemNs: $itemNs\n      sortBy: $sortBy\n      sortDir: $sortDir\n      releaseDate: $releaseDate\n      start: $start\n      tag: $tag\n      priceRange: $priceRange\n      freeGame: $freeGame\n      onSale: $onSale\n      effectiveDate: $effectiveDate\n    ) {\n      elements {\n        title\n        id\n        namespace\n        description\n        effectiveDate\n        keyImages {\n          type\n          url\n        }\n        currentPrice\n        seller {\n          id\n          name\n        }\n        productSlug\n        urlSlug\n        url\n        tags {\n          id\n        }\n        items {\n          id\n          namespace\n        }\n        customAttributes {\n          key\n          value\n        }\n        categories {\n          path\n        }\n        catalogNs {\n          mappings(pageType: \"productHome\") {\n            pageSlug\n            pageType\n          }\n        }\n        offerMappings {\n          pageSlug\n          pageType\n        }\n        price(country: $country) @include(if: $withPrice) {\n          totalPrice {\n            discountPrice\n            originalPrice\n            voucherDiscount\n            discount\n            currencyCode\n            currencyInfo {\n              decimals\n            }\n            fmtPrice(locale: $locale) {\n              originalPrice\n              discountPrice\n              intermediatePrice\n            }\n          }\n          lineOffers {\n            appliedRules {\n              id\n              endDate\n              discountSetting {\n                discountType\n              }\n            }\n          }\n        }\n        promotions(category: $category) @include(if: $withPromotions) {\n          promotionalOffers {\n            promotionalOffers {\n              startDate\n              endDate\n              discountSetting {\n                discountType\n                discountPercentage\n              }\n            }\n          }\n          upcomingPromotionalOffers {\n            promotionalOffers {\n              startDate\n              endDate\n              discountSetting {\n                discountType\n                discountPercentage\n              }\n            }\n          }\n        }\n      }\n      paging {\n        count\n        total\n      }\n    }\n  }\n}\n",
                "variables": {
                    "category": "games/edition/base|bundles/games|editors|software/edition/base",
                    "keywords": game,
                    "country": "US",
                    "locale": "en-US",
                    "sortDir": "DESC",
                    "withPrice": true,
                    "withMapping": false
                }
            }
        })
        const games = body.data.Catalog.searchStore.elements

        if (!games.length) return { text: `no games found`, reply: true }
        const gameData = games[0]
        const gamePrice = gameData.price.totalPrice.fmtPrice
        const discountPrice = gamePrice.discountPrice
        const originalPrice = gamePrice.originalPrice

        return { text: `https://www.epicgames.com/store/p/${encodeURIComponent(gameData.catalogNs.mappings[0].pageSlug)} | Price: ${discountPrice === "0" ? "Free" : discountPrice}${discountPrice !== originalPrice ? ` [🏷️ Discount from ${originalPrice}]` : ""}`, reply: true }
    },
};
