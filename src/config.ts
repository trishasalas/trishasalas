export const SITE = {
  website: "https://trishasalas.com/", // replace this with your deployed domain
  author: "Trisha Salas",
  profile: "",
  desc: "",
  title: "Trisha Salas",
  ogImage: "",
  lightAndDarkMode: true,
  postPerIndex: 10,
  postPerPage: 10,
  scheduledPostMargin: 15 * 60 * 1000, // 15 minutes
  showArchives: true,
  showBackButton: true, // show back button in post detail
  editPost: {
    enabled: false,
    text: "Edit page",
    url: "https://github.com/trishasalas/trishasalas/edit/main/",
  },
  dynamicOgImage: false,
  dir: "ltr", // "rtl" | "auto"
  lang: "en", // html lang code. Set this empty and default will be "en"
  timezone: "America/Chicago", // Default global timezone (IANA format)
  // https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
} as const;
