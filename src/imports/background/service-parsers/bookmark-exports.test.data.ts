const bookmarkOSInput = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
    <DT><A HREF="https://bookmarkos.com/how-to-use" ADD_DATE="1634649774" LAST_MODIFIED="1634673174">How to use Bookmark OS</A>
    <DT><H3 ADD_DATE="1634649174" LAST_MODIFIED="1634673174">Projects</H3>
    <DL><p>
        <DT><H3 ADD_DATE="1634673173" LAST_MODIFIED="1634673173">How to make the perfect paper airplane</H3>
        <DL><p>
            <DT><A HREF="https://www.youtube.com/watch?v=v29M7Oa1l-A" ADD_DATE="1634673173" LAST_MODIFIED="1634673173" TAGS="starred">How to make a paper airplane</A>
        </DL><p>
    </DL><p>
    <DT><H3 ADD_DATE="1634648574" LAST_MODIFIED="1634673174">Health</H3>
    <DL><p>
        <DT><A HREF="https://www.sleepfoundation.org/articles/healthy-sleep-tips" ADD_DATE="1634673173" LAST_MODIFIED="1634673173">How to maintain good sleep</A>
    </DL><p>
    <DT><H3 ADD_DATE="1634647974" LAST_MODIFIED="1634673174">To read</H3>
    <DL><p>
        <DT><A HREF="https://medium.com/@dariusforoux/my-20-best-productivity-tips-of-all-time-ea2f5fa8bc4f" ADD_DATE="1634673173" LAST_MODIFIED="1634673173">My 20 Best Productivity Tips Of All Time - Darius Foroux</A>
    </DL><p>
    <DT><H3 ADD_DATE="1634647374" LAST_MODIFIED="1634673174">Recipes</H3>
    <DL><p>
        <DT><A HREF="https://www.reddit.com/r/recipes/comments/a1errk/my_wifes_awesome_churro_cupcakes/" ADD_DATE="1634673173" LAST_MODIFIED="1634673173">Churro cupcakes</A>
    </DL><p>
    <DT><H3 ADD_DATE="1634646774" LAST_MODIFIED="1634673174">To watch</H3>
    <DL><p>
        <DT><H3 ADD_DATE="1634673173" LAST_MODIFIED="1634673173">Online videos</H3>
        <DL><p>
            <DT><A HREF="https://vimeo.com/67449472" ADD_DATE="1634673173" LAST_MODIFIED="1634673173">Timelapse - The Nature Light on Vimeo</A>
        </DL><p>
        <DT><H3 ADD_DATE="1634673173" LAST_MODIFIED="1634673173">Movies</H3>
        <DL><p>
            <DT><A HREF="https://www.imdb.com/title/tt0266543" ADD_DATE="1634673173" LAST_MODIFIED="1634673173">Finding Nemo (2003)</A>
        </DL><p>
    </DL><p>
    <DT><H3 ADD_DATE="1634646174" LAST_MODIFIED="1634673174">To purchase</H3>
    <DL><p>
        <DT><A HREF="https://www.ikea.com/us/en/p/dryck-bubbel-paeron-sparkling-pear-drink-40226766/" ADD_DATE="1634673173" LAST_MODIFIED="1634673173">Sparkling pear drink - IKEA</A>
    </DL><p>
    <DT><H3 ADD_DATE="1634645574" LAST_MODIFIED="1634673174">Journal</H3>
    <DL><p>
    </DL><p>
    <DT><H3 ADD_DATE="1634644974" LAST_MODIFIED="1634673174">Bookmark OS help tabs</H3>
    <DL><p>
        <DT><A HREF="https://bookmarkos.com/keyboard-shortcuts" ADD_DATE="1634673173" LAST_MODIFIED="1634673173">Keyboard shortcuts</A>
        <DT><A HREF="https://bookmarkos.com/tips-and-trips" ADD_DATE="1634673173" LAST_MODIFIED="1634673173">Tips & tricks</A>
        <DT><A HREF="https://bookmarkos.com/how-to-use" ADD_DATE="1634673173" LAST_MODIFIED="1634673173">How to use Bookmark OS</A>
    </DL><p>
    <DT><A HREF="https://bookmarkos.s3.amazonaws.com/images/gifs/thrilled-to-have-you.gif" ADD_DATE="1634644374" LAST_MODIFIED="1634673174">We're thrilled to have you!</A>
</DL><p>`
const bookmarkOSOutput = `[{"url":"https://bookmarkos.com/how-to-use","title":"How to use Bookmark OS","tags":[],"collections":[""],"timeAdded":1634649774},{"url":"https://www.youtube.com/watch?v=v29M7Oa1l-A","title":"How to make a paper airplane","tags":["starred"],"collections":["Projects > How to make the perfect paper airplane"],"timeAdded":1634673173},{"url":"https://www.sleepfoundation.org/articles/healthy-sleep-tips","title":"How to maintain good sleep","tags":[],"collections":["Health"],"timeAdded":1634673173},{"url":"https://medium.com/@dariusforoux/my-20-best-productivity-tips-of-all-time-ea2f5fa8bc4f","title":"My 20 Best Productivity Tips Of All Time - Darius Foroux","tags":[],"collections":["To read"],"timeAdded":1634673173},{"url":"https://www.reddit.com/r/recipes/comments/a1errk/my_wifes_awesome_churro_cupcakes/","title":"Churro cupcakes","tags":[],"collections":["Recipes"],"timeAdded":1634673173},{"url":"https://vimeo.com/67449472","title":"Timelapse - The Nature Light on Vimeo","tags":[],"collections":["To watch > Online videos"],"timeAdded":1634673173},{"url":"https://www.imdb.com/title/tt0266543","title":"Finding Nemo (2003)","tags":[],"collections":["To watch > Movies"],"timeAdded":1634673173},{"url":"https://www.ikea.com/us/en/p/dryck-bubbel-paeron-sparkling-pear-drink-40226766/","title":"Sparkling pear drink - IKEA","tags":[],"collections":["To purchase"],"timeAdded":1634673173},{"url":"https://bookmarkos.com/keyboard-shortcuts","title":"Keyboard shortcuts","tags":[],"collections":["Bookmark OS help tabs"],"timeAdded":1634673173},{"url":"https://bookmarkos.com/tips-and-trips","title":"Tips & tricks","tags":[],"collections":["Bookmark OS help tabs"],"timeAdded":1634673173},{"url":"https://bookmarkos.com/how-to-use","title":"How to use Bookmark OS","tags":[],"collections":["Bookmark OS help tabs"],"timeAdded":1634673173},{"url":"https://bookmarkos.s3.amazonaws.com/images/gifs/thrilled-to-have-you.gif","title":"We're thrilled to have you!","tags":[],"collections":[""],"timeAdded":1634644374}]`
export const bookmarkOS = { input: bookmarkOSInput, output: bookmarkOSOutput }
const diigoInput = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<!-- This is an automatically generated file.
  It will be read and overwritten.
  Do Not Edit! -->
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
<DT><A HREF="https://en.wikipedia.org/wiki/Memex" LAST_VISIT="1553884852" ADD_DATE="1533327176" PRIVATE="1" TAGS="Tag-to-page,tag-to-page-2">Memex - Wikipedia</A>
<DT><A HREF="https://www.couchsurfing.com/messages" LAST_VISIT="1459193701" ADD_DATE="1459193699" PRIVATE="0" TAGS="no_tag">Messages with Rene Flores | Messages | Couchsurfing</A>
<DT><A HREF="https://www.diigo.com/tools/diigolet" LAST_VISIT="1459182494" ADD_DATE="1459182482" PRIVATE="1" TAGS="no_tag">Diigolet | Diigo</A>
<DT><A HREF="http://help.diigo.com/how-to-use-chrome-extension/getting-started-chrome-extension?k=99e52fb01609acb2f5fbb060c285a743" LAST_VISIT="1459182443" ADD_DATE="1459182443" PRIVATE="1" TAGS="Diigo,Chrome">Getting Started with Chrome extension - Diigo help</A>
<DT><A HREF="https://www.diigo.com/item/pdf/5m7ms/5y42" LAST_VISIT="1459182564" ADD_DATE="1459182443" PRIVATE="1" TAGS="no_tag">Try PDF annotation - Active Reading: The Art of Annotation</A>
</DL><p>
`
const diigoOutput =
    '[{"url":"https://en.wikipedia.org/wiki/Memex","title":"Memex - Wikipedia","tags":["tag-to-page","tag-to-page-2"],"collections":["Imported Bookmarks"],"timeAdded":1533327176},{"url":"https://www.couchsurfing.com/messages","title":"Messages with Rene Flores | Messages | Couchsurfing","tags":["no_tag"],"collections":["Imported Bookmarks"],"timeAdded":1459193699},{"url":"https://www.diigo.com/tools/diigolet","title":"Diigolet | Diigo","tags":["no_tag"],"collections":["Imported Bookmarks"],"timeAdded":1459182482},{"url":"http://help.diigo.com/how-to-use-chrome-extension/getting-started-chrome-extension?k=99e52fb01609acb2f5fbb060c285a743","title":"Getting Started with Chrome extension - Diigo help","tags":["diigo","chrome"],"collections":["Imported Bookmarks"],"timeAdded":1459182443},{"url":"https://www.diigo.com/item/pdf/5m7ms/5y42","title":"Try PDF annotation - Active Reading: The Art of Annotation","tags":["no_tag"],"collections":["Imported Bookmarks"],"timeAdded":1459182443}]'
export const diigo = { input: diigoInput, output: diigoOutput }

const googleBookmarksInput = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
<DT><H3 ADD_DATE="1555162818707001">Sem marcadores</H3>
<DL><p>
<DT><A HREF="http://maps.google.com/?q=Tianjin,+China&amp;ftid=0x35edfc621e2c0e87:0x847194b730884031" ADD_DATE="1555162438458001">Tianjin, China</A>
<DT><A HREF="http://maps.google.com/?q=Suzhou,+Jiangsu,+China&amp;ftid=0x35b3a0d19bd25e07:0x21e57f85bd766004" ADD_DATE="1555162777246001">Suzhou, Jiangsu, China</A>
<DT><A HREF="http://maps.google.com/?cid=9843553755403725440" ADD_DATE="1505949028461001">Skatepark de São Sebastião</A>
<DT><A HREF="http://maps.google.com/?q=47.409916,8.536926" ADD_DATE="1598705889316080">47.409916,8.536926</A>
<DT><A HREF="http://maps.google.com/?cid=11057445006254129752" ADD_DATE="1579184744094001">VIA Consulting, S.A.</A>
<DT><A HREF="http://maps.google.com/?cid=9750852188347724557" ADD_DATE="1473094832266001">Restaurante La Mi Venta</A>
<DT><A HREF="http://maps.google.com/?q=Mudu,+Wuzhong,+Suzhou,+Jiangsu,+China&amp;ftid=0x35b374da9ad8d619:0x9b829d98ba92786d" ADD_DATE="1555163106816001">Mudu, Wuzhong, Suzhou, Jiangsu, China</A>
<DT><A HREF="http://maps.google.com/?q=Zhujiajiaozhen,+Qingpu,+Xangai,+China&amp;ftid=0x35b2f9b5de2f544f:0xa3bebb75834c614e" ADD_DATE="1555162686278001">Zhujiajiaozhen, Qingpu, Xangai, China</A>
<DT><A HREF="http://maps.google.com/?cid=7288862043792916006" ADD_DATE="1473094963372001">El Alambique</A>
<DT><A HREF="http://maps.google.com/?q=Tonglizhen,+Distrito+de+Wujiang,+Suzhou,+Jiangsu,+China&amp;ftid=0x35b305fbc89cd983:0x1a2400827fd40db7" ADD_DATE="1555162889807001">Tonglizhen, Distrito de Wujiang, Suzhou, Jiangsu, China</A>
<DT><A HREF="http://maps.google.com/?q=Xian,+Shaanxi,+China&amp;ftid=0x366379e922ac17b9:0x85d466fda794582e" ADD_DATE="1555162465240001">Xian, Shaanxi, China</A>
<DT><A HREF="http://maps.google.com/?q=Luzhizhen,+Wuzhong,+Suzhou,+Jiangsu,+China&amp;ftid=0x35b3ab4226dc59f3:0x37b652baf1ef9ac9" ADD_DATE="1555163061619001">Luzhizhen, Wuzhong, Suzhou, Jiangsu, China</A>
<DT><A HREF="http://maps.google.com/?q=Wuzhenzhen,+Tongxiang,+Jiaxing,+Zhejiang,+China,+314501&amp;ftid=0x35b349852f9419cd:0x5d7bbb1def903a76" ADD_DATE="1555163033346001">Wuzhenzhen, Tongxiang, Jiaxing, Zhejiang, China, 314501</A>
<DT><A HREF="http://maps.google.com/?q=The+Spire,+North+City,+Dublin,+Ireland&amp;ftid=0x48670e843e66bd41:0x4978811bdf0f9af7" ADD_DATE="1564475686935001">The Spire, North City, Dublin, Ireland</A>
<DT><A HREF="http://maps.google.com/?cid=2788012444089251808" ADD_DATE="1567353121287001">Continente Bom Dia Coimbra</A>
<DT><A HREF="http://maps.google.com/?q=Datong,+Shanxi,+China&amp;ftid=0x35e2d387156011f5:0x96198820001f0273" ADD_DATE="1555162450887001">Datong, Shanxi, China</A>
<DT><A HREF="http://maps.google.com/?q=Zhouzhuangzhen,+Kunshan,+Suzhou,+Jiangsu,+China&amp;ftid=0x35b303cb38877c13:0x28d028f382dc6eaa" ADD_DATE="1555162302504001">Zhouzhuangzhen, Kunshan, Suzhou, Jiangsu, China</A>
<DT><A HREF="http://maps.google.com/?q=Bahnhofstrasse,+8001+Z%C3%BCrich,+Switzerland&amp;ftid=0x47900a076b2da745:0xe9704f64fa1de8c0" ADD_DATE="1568294524481001">Bahnhofstrasse, 8001 Zürich, Switzerland</A>
<DT><A HREF="http://maps.google.com/?cid=1296416491423857839" ADD_DATE="1473095069977001">Los Bocadillos</A>
<DT><A HREF="http://maps.google.com/?q=Nanxun,+Huzhou,+Zhejiang,+China&amp;ftid=0x35b345d3a3176a45:0xa6a82cf7b7b115d6" ADD_DATE="1555162989526001">Nanxun, Huzhou, Zhejiang, China</A>
<DT><A HREF="http://maps.google.com/?q=38.77038433482241,-9.152090437710285" ADD_DATE="1566829996078001">38.77038433482241,-9.152090437710285</A>
<DT><A HREF="http://maps.google.com/?q=Hongcunzhen,+Yixian,+Huangshan,+Anhui,+China&amp;ftid=0x3435d385f8cbfd3d:0x1f11f73341bf8086" ADD_DATE="1555166966432001">Hongcunzhen, Yixian, Huangshan, Anhui, China</A>
<DT><A HREF="http://maps.google.com/?cid=18416314648752301831" ADD_DATE="1555162516501001">Grutas de Yungang</A>
<DT><A HREF="http://maps.google.com/?q=Xitangzhen,+Condado+de+Jiashan,+Jiaxing,+Zhejiang,+China&amp;ftid=0x35b2e1fd82763f57:0x2ba1cd67869a4c8" ADD_DATE="1555162818707001">Xitangzhen, Condado de Jiashan, Jiaxing, Zhejiang, China</A>
</DL><p>
</DL><p>`
const googleBookmarksOutput =
    '[{"url":"http://maps.google.com/?q=Tianjin,+China&ftid=0x35edfc621e2c0e87:0x847194b730884031","title":"Tianjin, China","tags":[],"collections":["Sem marcadores"],"timeAdded":1555162438458001},{"url":"http://maps.google.com/?q=Suzhou,+Jiangsu,+China&ftid=0x35b3a0d19bd25e07:0x21e57f85bd766004","title":"Suzhou, Jiangsu, China","tags":[],"collections":["Sem marcadores"],"timeAdded":1555162777246001},{"url":"http://maps.google.com/?cid=9843553755403725440","title":"Skatepark de São Sebastião","tags":[],"collections":["Sem marcadores"],"timeAdded":1505949028461001},{"url":"http://maps.google.com/?q=47.409916,8.536926","title":"47.409916,8.536926","tags":[],"collections":["Sem marcadores"],"timeAdded":1598705889316080},{"url":"http://maps.google.com/?cid=11057445006254129752","title":"VIA Consulting, S.A.","tags":[],"collections":["Sem marcadores"],"timeAdded":1579184744094001},{"url":"http://maps.google.com/?cid=9750852188347724557","title":"Restaurante La Mi Venta","tags":[],"collections":["Sem marcadores"],"timeAdded":1473094832266001},{"url":"http://maps.google.com/?q=Mudu,+Wuzhong,+Suzhou,+Jiangsu,+China&ftid=0x35b374da9ad8d619:0x9b829d98ba92786d","title":"Mudu, Wuzhong, Suzhou, Jiangsu, China","tags":[],"collections":["Sem marcadores"],"timeAdded":1555163106816001},{"url":"http://maps.google.com/?q=Zhujiajiaozhen,+Qingpu,+Xangai,+China&ftid=0x35b2f9b5de2f544f:0xa3bebb75834c614e","title":"Zhujiajiaozhen, Qingpu, Xangai, China","tags":[],"collections":["Sem marcadores"],"timeAdded":1555162686278001},{"url":"http://maps.google.com/?cid=7288862043792916006","title":"El Alambique","tags":[],"collections":["Sem marcadores"],"timeAdded":1473094963372001},{"url":"http://maps.google.com/?q=Tonglizhen,+Distrito+de+Wujiang,+Suzhou,+Jiangsu,+China&ftid=0x35b305fbc89cd983:0x1a2400827fd40db7","title":"Tonglizhen, Distrito de Wujiang, Suzhou, Jiangsu, China","tags":[],"collections":["Sem marcadores"],"timeAdded":1555162889807001},{"url":"http://maps.google.com/?q=Xian,+Shaanxi,+China&ftid=0x366379e922ac17b9:0x85d466fda794582e","title":"Xian, Shaanxi, China","tags":[],"collections":["Sem marcadores"],"timeAdded":1555162465240001},{"url":"http://maps.google.com/?q=Luzhizhen,+Wuzhong,+Suzhou,+Jiangsu,+China&ftid=0x35b3ab4226dc59f3:0x37b652baf1ef9ac9","title":"Luzhizhen, Wuzhong, Suzhou, Jiangsu, China","tags":[],"collections":["Sem marcadores"],"timeAdded":1555163061619001},{"url":"http://maps.google.com/?q=Wuzhenzhen,+Tongxiang,+Jiaxing,+Zhejiang,+China,+314501&ftid=0x35b349852f9419cd:0x5d7bbb1def903a76","title":"Wuzhenzhen, Tongxiang, Jiaxing, Zhejiang, China, 314501","tags":[],"collections":["Sem marcadores"],"timeAdded":1555163033346001},{"url":"http://maps.google.com/?q=The+Spire,+North+City,+Dublin,+Ireland&ftid=0x48670e843e66bd41:0x4978811bdf0f9af7","title":"The Spire, North City, Dublin, Ireland","tags":[],"collections":["Sem marcadores"],"timeAdded":1564475686935001},{"url":"http://maps.google.com/?cid=2788012444089251808","title":"Continente Bom Dia Coimbra","tags":[],"collections":["Sem marcadores"],"timeAdded":1567353121287001},{"url":"http://maps.google.com/?q=Datong,+Shanxi,+China&ftid=0x35e2d387156011f5:0x96198820001f0273","title":"Datong, Shanxi, China","tags":[],"collections":["Sem marcadores"],"timeAdded":1555162450887001},{"url":"http://maps.google.com/?q=Zhouzhuangzhen,+Kunshan,+Suzhou,+Jiangsu,+China&ftid=0x35b303cb38877c13:0x28d028f382dc6eaa","title":"Zhouzhuangzhen, Kunshan, Suzhou, Jiangsu, China","tags":[],"collections":["Sem marcadores"],"timeAdded":1555162302504001},{"url":"http://maps.google.com/?q=Bahnhofstrasse,+8001+Z%C3%BCrich,+Switzerland&ftid=0x47900a076b2da745:0xe9704f64fa1de8c0","title":"Bahnhofstrasse, 8001 Zürich, Switzerland","tags":[],"collections":["Sem marcadores"],"timeAdded":1568294524481001},{"url":"http://maps.google.com/?cid=1296416491423857839","title":"Los Bocadillos","tags":[],"collections":["Sem marcadores"],"timeAdded":1473095069977001},{"url":"http://maps.google.com/?q=Nanxun,+Huzhou,+Zhejiang,+China&ftid=0x35b345d3a3176a45:0xa6a82cf7b7b115d6","title":"Nanxun, Huzhou, Zhejiang, China","tags":[],"collections":["Sem marcadores"],"timeAdded":1555162989526001},{"url":"http://maps.google.com/?q=38.77038433482241,-9.152090437710285","title":"38.77038433482241,-9.152090437710285","tags":[],"collections":["Sem marcadores"],"timeAdded":1566829996078001},{"url":"http://maps.google.com/?q=Hongcunzhen,+Yixian,+Huangshan,+Anhui,+China&ftid=0x3435d385f8cbfd3d:0x1f11f73341bf8086","title":"Hongcunzhen, Yixian, Huangshan, Anhui, China","tags":[],"collections":["Sem marcadores"],"timeAdded":1555166966432001},{"url":"http://maps.google.com/?cid=18416314648752301831","title":"Grutas de Yungang","tags":[],"collections":["Sem marcadores"],"timeAdded":1555162516501001},{"url":"http://maps.google.com/?q=Xitangzhen,+Condado+de+Jiashan,+Jiaxing,+Zhejiang,+China&ftid=0x35b2e1fd82763f57:0x2ba1cd67869a4c8","title":"Xitangzhen, Condado de Jiashan, Jiaxing, Zhejiang, China","tags":[],"collections":["Sem marcadores"],"timeAdded":1555162818707001}]'
export const googleBookmarks = {
    input: googleBookmarksInput,
    output: googleBookmarksOutput,
}
const instapaperInput = `<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<title>Instapaper: Export</title>
</head>
<body>

<h1>test</h1>
<ol>

<li><a href="https://en.wikipedia.org/wiki/United_States">United States - Wikipedia</a>

</ol>

<h1>test2</h1>
<ol>

<li><a href="https://lithub.com/the-octopus-an-alien-among-us/">The Octopus: An Alien Among Us</a>

</ol>

<h1>Unread</h1>
<ol>

<li><a href="https://www.google.de/webhp?espv=210&amp;ie=UTF-8&amp;rlz=1C5CHFA_enDE529DE529&amp;sourceid=chrome-instant">https://www.google.de/webhp?espv=210&amp;ie=UTF-8&amp;rlz=1C5CHFA_enDE529DE529&amp;sourceid=chrome-instant</a>

<li><a href="http://www.isnichwahr.de/">Fun Pics, lustige Videos und Online Games kostenlos auf isnichwahr.de</a>

</ol>

</body>
</html>
`
const instapaperOutput =
    '[{"url":"https://en.wikipedia.org/wiki/United_States","title":"United States - Wikipedia","tags":[],"collections":["test"],"timeAdded":1637109456469},{"url":"https://lithub.com/the-octopus-an-alien-among-us/","title":"The Octopus: An Alien Among Us","tags":[],"collections":["test2"],"timeAdded":1637109456469},{"url":"https://www.google.de/webhp?espv=210&ie=UTF-8&rlz=1C5CHFA_enDE529DE529&sourceid=chrome-instant","title":"https://www.google.de/webhp?espv=210&ie=UTF-8&rlz=1C5CHFA_enDE529DE529&sourceid=chrome-instant","tags":[],"collections":["Unread"],"timeAdded":1637109456469},{"url":"http://www.isnichwahr.de/","title":"Fun Pics, lustige Videos und Online Games kostenlos auf isnichwahr.de","tags":[],"collections":["Unread"],"timeAdded":1637109456469}]'

const pinboardInput = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<title>Pinboard Bookmarks</title>
<h1>Bookmarks</h1>

<dl>
  <p>
    <dt>
      <a
        href="https://www.youtube.com/watch?v=ZdR39RbntNU"
        ADD_DATE="1635303910"
        PRIVATE="1"
        TOREAD="0"
        TAGS="Music"
        >Nightcore Mix 2021 ♫ Best Remixes of Popular Songs 2021 ♫ 1 Hour
        Nightcore - YouTube</a
      >
    </dt>
    <dd>
      &lt;blockquote&gt;Nightcore Mix 2021 ♫ Best Remixes of Popular Songs 2021
      ♫ 1 Hour NightcoreLike = MotivationIf you enjoyed this mix, please be sure
      to comment &quot;kurumi ara ara...&lt;/blockquote&gt;
    </dd>

    <dt>
      <a
        href="https://help.tara.ai/en/articles/5672365-using-agile-to-manage-client-projects-as-a-digital-agency"
        ADD_DATE="1635268517"
        PRIVATE="1"
        TOREAD="0"
        TAGS="ProjectManagement"
        >Using Agile to Manage Client Projects as a Digital Agency | Tara AI
        Help Center</a
      >
    </dt>
    <dd>
      &lt;blockquote&gt;A guide on how to deliver tight client deadlines on time
      using agile project management, as a digital agency.&lt;/blockquote&gt;
    </dd>

    <dt>
      <a
        href="https://www.youtube.com/watch?v=Un2C5RLDRD0"
        ADD_DATE="1635259581"
        PRIVATE="1"
        TOREAD="0"
        TAGS="Music"
        >✞ HORROR! ✞ Nightcore Creepy Mix pt. II (1 Hour) - YouTube</a
      >
    </dt>
    <dd>
      &lt;blockquote&gt;✞ HORROR! ✞ Nightcore Creepy Mix (1 Hour)Like =
      MotivationIf you enjoyed this mix, please be sure to comment &quot;kurumi
      ara ara&quot;Tracklist:00:00 Nightcore - Stil...&lt;/blockquote&gt;
    </dd>

    <dt>
      <a
        href="https://www.youtube.com/watch?v=LC-RlwqHZ2A"
        ADD_DATE="1635256393"
        PRIVATE="1"
        TOREAD="0"
        TAGS="Music"
        >✞ HORROR! ✞ Nightcore Creepy Mix (1 Hour) - YouTube</a
      >
    </dt>
    <dd>
      &lt;blockquote&gt;✞ HORROR! ✞ Nightcore Creepy Mix (1 Hour)Like =
      MotivationIf you enjoyed this mix, please be sure to comment &quot;kurumi
      ara ara&quot;Tracklist:00:00 Nightcore - Stil...&lt;/blockquote&gt;
    </dd>

    <dt>
      <a
        href="https://news.ycombinator.com/item?id=28991200"
        ADD_DATE="1635212639"
        PRIVATE="1"
        TOREAD="0"
        TAGS=""
        >Ephemeralization | Hacker News</a
      >
    </dt>
  </p>
</dl>
`
export const instapaper = { input: instapaperInput, output: instapaperOutput }

const pinboardOutput =
    '[{"url":"https://www.youtube.com/watch?v=ZdR39RbntNU","title":"Nightcore Mix 2021 ♫ Best Remixes of Popular Songs 2021 ♫ 1 Hour\\n        Nightcore - YouTube","tags":["music"],"collections":["Imported Bookmarks"],"timeAdded":1635303910},{"url":"https://help.tara.ai/en/articles/5672365-using-agile-to-manage-client-projects-as-a-digital-agency","title":"Using Agile to Manage Client Projects as a Digital Agency | Tara AI\\n        Help Center","tags":["projectmanagement"],"collections":["Imported Bookmarks"],"timeAdded":1635268517},{"url":"https://www.youtube.com/watch?v=Un2C5RLDRD0","title":"✞ HORROR! ✞ Nightcore Creepy Mix pt. II (1 Hour) - YouTube","tags":["music"],"collections":["Imported Bookmarks"],"timeAdded":1635259581},{"url":"https://www.youtube.com/watch?v=LC-RlwqHZ2A","title":"✞ HORROR! ✞ Nightcore Creepy Mix (1 Hour) - YouTube","tags":["music"],"collections":["Imported Bookmarks"],"timeAdded":1635256393},{"url":"https://news.ycombinator.com/item?id=28991200","title":"Ephemeralization | Hacker News","tags":[],"collections":["Imported Bookmarks"],"timeAdded":1635212639}]'
export const pinboard = { input: pinboardInput, output: pinboardOutput }

const raindropInput = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Raindrop.io Bookmarks</TITLE>
<H1>Raindrop.io Bookmarks</H1>
<DL><p>
	<DT><H3 ADD_DATE="0" LAST_MODIFIED="0">Speed Dial</H3>
	<DL><p>
	</DL><p>
	<DT><H3 ADD_DATE="0" LAST_MODIFIED="0">Unsorted</H3>
	<DL><p>
	</DL><p>
	<DT><H3 ADD_DATE="1516641170" LAST_MODIFIED="1614770084">test</H3>
	<DL><p>
		<DT><A HREF="http://www.nytimes.com/2011/10/19/nyregion/new-york-planting-a-million-treestoo-many-some-say.html" ADD_DATE="1530349052" LAST_MODIFIED="1592235496" TAGS="test" DATA-COVER="https://static01.nyt.com/images/2014/12/09/us/Tlogo-news-black-on-white/Tlogo-news-black-on-white-mediumThreeByTwo440.png">New York Planting One Million Trees, Too Many for Some</A>
		<DD>Halfway through the city’s Million Trees campaign, even supporters worry about dead wood and other future hazards if maintenance money is lacking.
		<DT><A HREF="https://docs.google.com/document/d/1uxMDMrLuVTndNgv9IekdLLUeKEIYcHxiW5Nx94yQl4g/edit?ts=5b3396af" ADD_DATE="1530201486" LAST_MODIFIED="1530201486" TAGS="area,outputs" DATA-COVER="https://lh3.googleusercontent.com/paLYpqM44gO6VewHNi0KNNHWZaJu0UTQddC0jNccx0_c7umBQytkMO8moYJHb015XtAMyg=w1200-h630-p">MOSS outputs sharing server</A>
		<DD>We attempt to estimate the approximate time each feature area will take to implement by dividing each feature area into its subfeatures and determining their individual complexity and time required for both the design and development phases. We then add a margin to these estimates depending on th...
		<DT><A HREF="https://www.nytimes.com/2018/06/27/nyregion/nixon-cuomo-ocasio-cortez-new-york.html?ribbon-ad-idx=5&rref=nyregion&module=Ribbon&version=context&region=Header&action=click&contentCollection=New%20York&pgtype=article" ADD_DATE="1530177678" LAST_MODIFIED="1592235498" TAGS="" DATA-COVER="https://static01.nyt.com/images/2018/06/28/nyregion/28cuomo-nixon/merlin_140344524_26e7730a-5a4a-4c51-8fbc-82fedf805a33-mediumThreeByTwo440.jpg">What Does Ocasio-Cortez’s Win Mean for Cynthia Nixon?</A>
		<DD>Ms. Nixon, who is challenging Gov. Andrew Cuomo in the Democratic primary, is seeking to draw parallels to Alexandria Ocasio-Cortez’s upset win.
	</DL><p>
	<DT><H3 ADD_DATE="1518865519" LAST_MODIFIED="1592235498">test2</H3>
	<DL><p>
	</DL><p>
	<DT><H3 ADD_DATE="1518865532" LAST_MODIFIED="1614770048">test4</H3>
	<DL><p>
		<DT><A HREF="https://chrome.google.com/webstore/category/extensions?hl=en" ADD_DATE="1513789170" LAST_MODIFIED="1614770048" TAGS="" DATA-COVER="https://ssl.gstatic.com/chrome/webstore/images/chrome_web_store-128.png">Chrome Web Store</A>
		<DD>Small programs that add new features to your browser and personalize your browsing experience.
		<DT><H3 ADD_DATE="1553888508" LAST_MODIFIED="1614770084">TESTsub</H3>
		<DL><p>
			<DT><A HREF="https://github.com/WorldBrain/Memex/pull/317#issuecomment-369571557" ADD_DATE="1519926001" LAST_MODIFIED="1614770084" TAGS="" DATA-COVER="https://avatars0.githubusercontent.com/u/13897276?s=400&v=4">[W.I.P.] Comments and Annotations by migom6 · Pull Request #317 · WorldBrain/Memex</A>
			<DD>This PR aims to solve the issue #301. Progress till now: Implemented presentational components for Comment DropDown feature. Read the code base to understand how the RPCs were called. Mock data mo...
			<DT><A HREF="https://lifehacker.com/5894995/bookmark-and-read-later-apps-compared-read-it-later-vs-instapaper-vs-readability" ADD_DATE="1513788975" LAST_MODIFIED="1614770037" TAGS="" DATA-COVER="https://i.kinja-img.com/gawker-media/image/upload/s---ot9KIwO--/c_fill,fl_progressive,g_center,h_450,q_80,w_800/18yb3zccn3n5ujpg.jpg">Apps Compared: Pocket vs. Instapaper vs. Readability</A>
			<DD>Chances are, you stumble upon a lot of articles during the day that look interesting, but that you don&#39;t have time to read right now. Lots of services have cropped up to solve this problem, and today we&#39;re looking at the most popular three and pitting them against one another: Pocket, Instapaper, and Readability. Here&#39;s how they stack up.
		</DL><p>
	</DL><p>
	<DT><H3 ADD_DATE="1518865527" LAST_MODIFIED="1614770087">test3</H3>
	<DL><p>
		<DT><A HREF="https://en.wikipedia.org/wiki/United_States" ADD_DATE="1592235646" LAST_MODIFIED="1614770076" TAGS="" DATA-COVER="https://upload.wikimedia.org/wikipedia/en/thumb/a/a4/Flag_of_the_United_States.svg/1200px-Flag_of_the_United_States.svg.png">United States - Wikipedia</A>
		<DT><A HREF="https://www.bahn.de/p/view/index.shtml" ADD_DATE="1513850292" LAST_MODIFIED="1614770087" TAGS="" DATA-COVER="https://www.bahn.de/common/view/static/v8/img/social-media/db_logo_sm_1200x630_2016.jpg">bahn.de - Ihr Mobilitätsportal für Reisen, Bahn, Urlaub, Hotels, Städtereisen und Mietwagen</A>
		<DD>Deutschlands beliebtestes Reise- und Mobilitätsportal: Auskunft, Bahnfahrkarten, Online-Tickets, Länder-Tickets, günstige Angebote rund um Urlaub und Reisen.
    </DL><p>
    </DL><p>
    `
const raindropOutput = `[{"url":"http://www.nytimes.com/2011/10/19/nyregion/new-york-planting-a-million-treestoo-many-some-say.html","title":"New York Planting One Million Trees, Too Many for Some","tags":["test"],"collections":["test"],"timeAdded":1530349052},{"url":"https://docs.google.com/document/d/1uxMDMrLuVTndNgv9IekdLLUeKEIYcHxiW5Nx94yQl4g/edit?ts=5b3396af","title":"MOSS outputs sharing server","tags":["area","outputs"],"collections":["test"],"timeAdded":1530201486},{"url":"https://www.nytimes.com/2018/06/27/nyregion/nixon-cuomo-ocasio-cortez-new-york.html?ribbon-ad-idx=5&rref=nyregion&module=Ribbon&version=context&region=Header&action=click&contentCollection=New%20York&pgtype=article","title":"What Does Ocasio-Cortez’s Win Mean for Cynthia Nixon?","tags":[],"collections":["test"],"timeAdded":1530177678},{"url":"https://chrome.google.com/webstore/category/extensions?hl=en","title":"Chrome Web Store","tags":[],"collections":["test4"],"timeAdded":1513789170},{"url":"https://github.com/WorldBrain/Memex/pull/317#issuecomment-369571557","title":"[W.I.P.] Comments and Annotations by migom6 · Pull Request #317 · WorldBrain/Memex","tags":[],"collections":["test4 > TESTsub"],"timeAdded":1519926001},{"url":"https://lifehacker.com/5894995/bookmark-and-read-later-apps-compared-read-it-later-vs-instapaper-vs-readability","title":"Apps Compared: Pocket vs. Instapaper vs. Readability","tags":[],"collections":["test4 > TESTsub"],"timeAdded":1513788975},{"url":"https://en.wikipedia.org/wiki/United_States","title":"United States - Wikipedia","tags":[],"collections":["test3"],"timeAdded":1592235646},{"url":"https://www.bahn.de/p/view/index.shtml","title":"bahn.de - Ihr Mobilitätsportal für Reisen, Bahn, Urlaub, Hotels, Städtereisen und Mietwagen","tags":[],"collections":["test3"],"timeAdded":1513850292}]`
export const raindrop = { input: raindropInput, output: raindropOutput }

const pocketInput = `<!DOCTYPE html>
<html>
	<!--So long and thanks for all the fish-->
	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
		<title>Pocket Export</title>
	</head>
	<body>
		<h1>Unread</h1>
		<ul>
			<li><a href="https://www.facebook.com/photo.php?fbid=10156448680240936&amp;set=ms.c.eJxlkDkKwEAMxH4UPPb6~_v~%3BHUgRSaFuhQcYyZZ0z1crJjXr0E98GCSuD00VHAUcrkGhjaza5ulpx3TNLp~_jIna1wrs7VGjpa~%3Bkd~_uEqQsc95AV8PSP0~-.bps.a.10156447501045936&amp;type=3&amp;theater" time_added="1564910046" tags="">Facebook</a></li>
      <li><a href="https://twitter.com/home" time_added="1563298794" tags="">Home / Twitter</a></li>
      <li><a href="https://getpocket.com/a/queue/list/" time_added="1484061280" tags="">Pocket: My List</a></li>

		</ul>
		
		<h1>Read Archive</h1>
		<ul>
			
		</ul>
	</body>
</html>`
const pocketOutput =
    '[{"url":"https://www.facebook.com/photo.php?fbid=10156448680240936&set=ms.c.eJxlkDkKwEAMxH4UPPb6~_v~%3BHUgRSaFuhQcYyZZ0z1crJjXr0E98GCSuD00VHAUcrkGhjaza5ulpx3TNLp~_jIna1wrs7VGjpa~%3Bkd~_uEqQsc95AV8PSP0~-.bps.a.10156447501045936&type=3&theater","title":"Facebook","tags":[],"collections":["Unread"],"timeAdded":1637115355635},{"url":"https://twitter.com/home","title":"Home / Twitter","tags":[],"collections":["Unread"],"timeAdded":1637115355635},{"url":"https://getpocket.com/a/queue/list/","title":"Pocket: My List","tags":[],"collections":["Unread"],"timeAdded":1637115355635}]'
export const pocket = { input: pocketInput, output: pocketOutput }
