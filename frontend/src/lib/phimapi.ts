export interface ParsedServer {
  server_name: string;
  lang_type: string;
  link_m3u8: string | null;
  link_embed: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface ParsedEpisode {
  name: string;
  slug: string;
  sort_order: number;
  servers: ParsedServer[];
}

/**
 * Trích xuất và nhóm danh sách tập phim & server phát từ cấu trúc PhimAPI
 */
export function parseEpisodesFromPhimApi(apiEpisodes: any[]): ParsedEpisode[] {
  if (!Array.isArray(apiEpisodes) || apiEpisodes.length === 0) {
    return [];
  }

  const epMap = new Map<string, ParsedEpisode>();

  apiEpisodes.forEach((serverGroup: any, groupIdx: number) => {
    const rawServerName = (serverGroup.server_name || `Server ${groupIdx + 1}`).trim();
    const serverData = Array.isArray(serverGroup.server_data) ? serverGroup.server_data : [];

    let langType = "vietsub";
    const lowerName = rawServerName.toLowerCase();
    if (lowerName.includes("thuyết minh") || lowerName.includes("thuyet minh")) {
      langType = "thuyet-minh";
    } else if (lowerName.includes("lồng tiếng") || lowerName.includes("long tieng")) {
      langType = "long-tieng";
    } else if (lowerName.includes("engsub") || lowerName.includes("english")) {
      langType = "engsub";
    } else if (lowerName.includes("raw")) {
      langType = "raw";
    }

    serverData.forEach((epItem: any, epIdx: number) => {
      const epName = (epItem.name || `Tập ${epIdx + 1}`).trim();
      const epSlug = (epItem.slug || `tap-${epIdx + 1}`).trim();

      if (!epMap.has(epSlug)) {
        epMap.set(epSlug, {
          name: epName,
          slug: epSlug,
          sort_order: epMap.size + 1,
          servers: [],
        });
      }

      const current = epMap.get(epSlug)!;
      current.servers.push({
        server_name: rawServerName,
        lang_type: langType,
        link_m3u8: epItem.link_m3u8 || null,
        link_embed: epItem.link_embed || null,
        sort_order: current.servers.length + 1,
        is_active: true,
      });
    });
  });

  return Array.from(epMap.values());
}
