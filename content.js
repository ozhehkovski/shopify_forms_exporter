
(function () {
  async function handleDownload() {
    try {
      const { storeHandle, appId, formId } = parsePageInfo();
      const csrfToken = await getCsrfToken();
      if (!csrfToken) throw new Error("CSRF_MISSING");
      const records = await fetchAllSubmissions(storeHandle, appId, formId, csrfToken);
      const csv = convertToCSV(records);
      downloadCSV(csv, `form_${formId}_submissions_${new Date().toISOString().slice(0,10)}.csv`);
      chrome.runtime.sendMessage({type: "download-complete", success: true});
    } catch (err) {
      console.error("Shopify Forms Exporter error:", err);
      chrome.runtime.sendMessage({type: "download-complete", success: false, error: err.message});
    }
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type === "downloadData") handleDownload();
  });

  function getCsrfToken() {
    return new Promise(resolve=>{
      chrome.runtime.sendMessage({type:"get-csrf"}, resp=> resolve(resp?.token||""));
    });
  }

  function parsePageInfo() {
    const href = window.location.href;
    // Try to capture both appId and formId from full url
    let m = href.match(/app--(\d+)--shopify-forms(\d{3,})/);
    let appId, formId;
    if (m) {
      appId = m[1];
      formId = m[2];
    } else {
      // fallback: only formId present
      m = href.match(/shopify-forms(\d{3,})/);
      if (!m) throw new Error("Form ID not found in URL");
      formId = m[1];
      // default Shopify Forms appId
      appId = "6171699";
    }

    // store handle
    const parts = window.location.pathname.split("/");
    const storeIdx = parts.indexOf("store");
    if (storeIdx === -1) throw new Error("Store handle not found");
    const storeHandle = parts[storeIdx+1];

    return { storeHandle, appId, formId };
  }

  async function fetchAllSubmissions(storeHandle, appId, formId, csrfToken) {
    const type = `app--${appId}--shopify-forms${formId}`;
    const endpoint = `https://admin.shopify.com/api/shopify/${storeHandle}?operation=MetaobjectIndex&type=query`;
    const QUERY = `
    query Submissions($first:Int!,$after:String,$type:String!,$query:String){
      metaobjects: allMetaobjects(first:$first,after:$after,type:$type,query:$query,sortKey:"updated_at",reverse:true){
        edges{cursor node{id displayName createdAt updatedAt fields{key value type}}}
        pageInfo{hasNextPage endCursor}
      }
    }`;

    let after=null, rows=[];
    do{
      const variables={first:250,after,type,query:`added_by:app--${appId}`};
      const headers={
        "Content-Type":"application/json",
        "Accept":"application/json",
        "x-shopify-web-force-proxy":"1"
      };
      if(csrfToken) headers["x-csrf-token"]=csrfToken;
      const resp=await fetch(endpoint,{
        method:"POST",
        headers,
        body:JSON.stringify({operationName:"Submissions",variables,query:QUERY}),
        credentials:"include"
      });
      if(resp.status===403) throw new Error("403 – CSRF token invalid; reload page");
      if(!resp.ok) throw new Error(`Request failed with status ${resp.status}`);
      const data=await resp.json();
      (data?.data?.metaobjects?.edges||[]).forEach(e=>rows.push(flatten(e.node)));
      const pageInfo=data?.data?.metaobjects?.pageInfo;
      after=pageInfo?.hasNextPage ? pageInfo.endCursor : null;
    }while(after);
    return rows;
  }

  function flatten(node){
    const r={id:node.id,displayName:node.displayName,createdAt:node.createdAt,updatedAt:node.updatedAt};
    node.fields.forEach(f=>r[f.key]=f.value);
    return r;
  }

  function convertToCSV(rows){
    if(!rows.length) return "";
    const headers=Array.from(new Set(rows.flatMap(Object.keys)));
    const esc=v=>`"${String(v??"").replace(/"/g,'""')}"`;
    const lines=[headers.map(esc).join(",")];
    rows.forEach(r=>lines.push(headers.map(h=>esc(r[h])).join(",")));
    return lines.join("\r\n");
  }

  function downloadCSV(csv,filename){
    const blob=new Blob([csv+"\r\n"],{type:"text/csv;charset=utf-8;"});
    const link=document.createElement("a");
    link.href=URL.createObjectURL(blob); link.download=filename;
    document.body.appendChild(link); link.click();
    setTimeout(()=>{document.body.removeChild(link); URL.revokeObjectURL(link.href);},0);
  }
})();
