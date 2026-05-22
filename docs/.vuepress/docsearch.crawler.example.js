/**
 * Algolia DocSearch 爬虫参考配置（粘贴到 https://crawler.algolia.com/ 编辑器）
 * 将 YOUR_* 替换为 Algolia 控制台中的实际值；indexName 与 docsearch.config.ts 一致。
 *
 * 部署后可在控制台手动 Re-crawl，或依赖 schedule 定时抓取。
 */
// eslint-disable-next-line no-undef
new Crawler({
  appId: "YOUR_APP_ID",
  apiKey: "YOUR_ADMIN_API_KEY",
  rateLimit: 8,
  startUrls: ["https://www.stonybear.com/"],
  sitemaps: ["https://www.stonybear.com/sitemap.xml"],
  ignoreCanonicalTo: false,
  exclusionPatterns: [],
  discoveryPatterns: ["https://www.stonybear.com/**"],
  schedule: "at 02:00 every 1 day",
  actions: [
    {
      indexName: "YOUR_INDEX_NAME",
      pathsToMatch: ["https://www.stonybear.com/**"],
      recordExtractor: ({ $, helpers }) => {
        return helpers.docsearch({
          recordProps: {
            lvl0: {
              selectors: [".vp-sidebar-link.active", "[vp-content] h1"],
              defaultValue: "Documentation",
            },
            lvl1: "[vp-content] h1",
            lvl2: "[vp-content] h2",
            lvl3: "[vp-content] h3",
            lvl4: "[vp-content] h4",
            lvl5: "[vp-content] h5",
            lvl6: "[vp-content] h6",
            content: "[vp-content] p, [vp-content] li",
          },
          recordVersion: "v3",
        });
      },
    },
  ],
  initialIndexSettings: {
    YOUR_INDEX_NAME: {
      attributesForFaceting: ["type", "lang"],
      attributesToRetrieve: ["hierarchy", "content", "anchor", "url"],
      attributesToHighlight: ["hierarchy", "hierarchy_camel", "content"],
      attributesToSnippet: ["content:10"],
      camelCaseAttributes: ["hierarchy", "hierarchy_radio", "content"],
      searchableAttributes: [
        "unordered(hierarchy_radio_camel.lvl0)",
        "unordered(hierarchy_radio.lvl0)",
        "unordered(hierarchy_radio_camel.lvl1)",
        "unordered(hierarchy_radio.lvl1)",
        "unordered(hierarchy_radio_camel.lvl2)",
        "unordered(hierarchy_radio.lvl2)",
        "unordered(hierarchy_radio_camel.lvl3)",
        "unordered(hierarchy_radio.lvl3)",
        "unordered(hierarchy_radio_camel.lvl4)",
        "unordered(hierarchy_radio.lvl4)",
        "unordered(hierarchy_radio_camel.lvl5)",
        "unordered(hierarchy_radio.lvl5)",
        "unordered(hierarchy_radio_camel.lvl6)",
        "unordered(hierarchy_radio.lvl6)",
        "unordered(hierarchy_camel.lvl0)",
        "unordered(hierarchy.lvl0)",
        "unordered(hierarchy_camel.lvl1)",
        "unordered(hierarchy.lvl1)",
        "unordered(hierarchy_camel.lvl2)",
        "unordered(hierarchy.lvl2)",
        "unordered(hierarchy_camel.lvl3)",
        "unordered(hierarchy.lvl3)",
        "unordered(hierarchy_camel.lvl4)",
        "unordered(hierarchy.lvl4)",
        "unordered(hierarchy_camel.lvl5)",
        "unordered(hierarchy.lvl5)",
        "unordered(hierarchy_camel.lvl6)",
        "unordered(hierarchy.lvl6)",
        "content",
      ],
      distinct: true,
      attributeForDistinct: "url",
      customRanking: [
        "desc(weight.pageRank)",
        "desc(weight.level)",
        "asc(weight.position)",
      ],
      ranking: [
        "words",
        "filters",
        "typo",
        "attribute",
        "proximity",
        "exact",
        "custom",
      ],
      highlightPreTag:
        '<span class="algolia-docsearch-suggestion--highlight">',
      highlightPostTag: "</span>",
      minWordSizefor1Typo: 3,
      minWordSizefor2Typos: 7,
      allowTyposOnNumericTokens: false,
      minProximity: 1,
      ignorePlurals: true,
      advancedSyntax: true,
      attributeCriteriaComputedByMinProximity: true,
      removeWordsIfNoResults: "allOptional",
    },
  },
});
