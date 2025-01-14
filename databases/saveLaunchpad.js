const logger = require("../helpers/logger");
const prisma = require("../helpers/prisma");

module.exports = (data) => {
  return new Promise(async (resolve) => {
    try {
      await prisma.launchpad.upsert({
        where: {
          contract: data.contract
        },
        create: {
          contract: data.contract,
          base_token: data.basetoken ? data.basetoken : null,
          special_token: data.specialtoken ? data.specialtoken : null,
          token: data.token,
          chain: Number(data.chain),
          presale_title: data.presaletitle,
          token_image: data.tokenimage,
          token_description: data.description,
          token_background: data.tokenbackground,
          token_weblink: data.weblink, 
          token_telegram: data.telegram,
          token_twitter: data.twitter,
          token_github: data.github,
          token_instagram: data.instagram,
          token_youtube: data.youtube, 
          owner: data.owner,    
          presalerate: data.presalerate,
          softcap: data.softcap,
          hardcap: data.hardcap,
          minbuy: data.minbuy,
          maxbuy: data.maxbuy,
          is_autolist: data.autolist,
          is_whitelist: data.whitelist,
          special_starttime: data.specialstart,
          starttime: data.starttime,
          endtime: data.endtime,
        },
        update: {
          base_token: data.basetoken ? data.basetoken : null,
          special_token: data.specialtoken ? data.specialtoken : null,
          token: data.token,
          chain: Number(data.chain),           
          presale_title: data.presaletitle,
          token_image: data.tokenimage,       
          token_description: data.description,
          token_background: data.tokenbackground, 
          token_weblink: data.weblink,    
          token_telegram: data.telegram,
          token_twitter: data.twitter,
          token_github: data.github,     
          token_instagram: data.instagram,   
          token_youtube: data.youtube,     
          owner: data.owner,          
          presalerate: data.presalerate,
          softcap: data.softcap,         
          hardcap: data.hardcap,         
          minbuy: data.minbuy,          
          maxbuy: data.maxbuy,   
          is_autolist: data.autolist,
          is_whitelist: data.whitelist,         
          special_starttime: data.specialstart,
          starttime: data.starttime,
          endtime: data.endtime,
        }
      });

      resolve(true);
    } catch (e) {
      logger.error("SAVE LAUNCHPAD ERROR: " + e.message);

      //
      resolve(false);
    }
  });
};
