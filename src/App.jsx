import { useState, useEffect, useCallback, useRef } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   AZ-204 EXAM SIMULATOR — Production Build (January 2026 Syllabus)
   
   Domain weights (real exam):
     1. Develop Azure Compute Solutions      25-30%  → ~28 questions
     2. Develop for Azure Storage             15-20%  → ~18 questions
     3. Implement Azure Security              15-20%  → ~18 questions
     4. Monitor & Troubleshoot                 5-10%  → ~8 questions
     5. Connect to & Consume Azure Services   20-25%  → ~30 questions
   
   102 question bank → 55 per exam (weighted random)
   ═══════════════════════════════════════════════════════════════════════════ */

const DOMAINS = [
  { name: "1. Compute Solutions", weight: 0.275, color: "#7C5CFC" },
  { name: "2. Azure Storage", weight: 0.175, color: "#2DD4BF" },
  { name: "3. Azure Security", weight: 0.175, color: "#FB923C" },
  { name: "4. Monitor & Troubleshoot", weight: 0.075, color: "#F472B6" },
  { name: "5. Azure Services", weight: 0.225, color: "#60A5FA" },
];

const FULL_BANK = [
  // ═══════════════════════════════════════════════════════════════════════
  // DOMAIN 1: DEVELOP AZURE COMPUTE SOLUTIONS (25-30%) — 30 questions
  // ═══════════════════════════════════════════════════════════════════════

  // ── 1.1 Containerized Solutions (10) ──
  {id:1,domain:1,topic:"Container Images & ACR",type:"single",
    text:"You build a Docker image locally and need to store it in Azure Container Registry for deployment to AKS. The registry must scan images for vulnerabilities automatically.\n\nWhich ACR SKU should you use?",
    options:["Basic","Standard","Premium","Free"],correct:2,
    explanation:"Premium SKU provides geo-replication, content trust, and automatic vulnerability scanning via Microsoft Defender for Containers."},
  {id:2,domain:1,topic:"Container Images & ACR",type:"single",
    text:"You need to build a container image directly in Azure without installing Docker locally.\n\nWhich command should you use?",
    options:["docker build --cloud","az acr build --registry myregistry --image myapp:v1 .","az container create --image myapp:v1","az webapp create --docker-image myapp:v1"],correct:1,
    explanation:"az acr build offloads the Docker build to ACR Tasks. It streams logs back and pushes the image to the registry — no local Docker needed."},
  {id:3,domain:1,topic:"Azure Container Instances",type:"single",
    text:"You need to run a containerized batch job once daily for 15 minutes. The container should not incur costs when idle.\n\nWhich service should you use?",
    options:["Azure Kubernetes Service","Azure Container Instances","App Service for Containers","Azure Container Apps"],correct:1,
    explanation:"ACI charges per-second only while running. For short-lived, infrequent jobs, ACI minimizes cost with no infrastructure management."},
  {id:4,domain:1,topic:"Azure Container Instances",type:"multi",
    text:"You deploy a multi-container group to ACI. The main app container needs a sidecar for log collection.\n\nWhich TWO statements are true about ACI container groups? (Choose 2)",
    options:["Containers in a group share the same network namespace (localhost)","Containers in a group can share mounted volumes","Each container in a group gets its own public IP","Container groups support Windows and Linux containers mixed together"],correct:[0,1],
    explanation:"Containers in a group share localhost networking and can mount shared volumes. Each group gets one IP. You cannot mix OS types."},
  {id:5,domain:1,topic:"Azure Container Apps",type:"single",
    text:"You need to deploy a microservices application with built-in autoscaling based on HTTP traffic and KEDA-supported triggers, without managing Kubernetes directly.\n\nWhich service should you use?",
    options:["Azure Kubernetes Service","Azure Container Instances","Azure Container Apps","Azure App Service"],correct:2,
    explanation:"Container Apps provides serverless containers with built-in KEDA autoscaling, Dapr integration, and ingress — no Kubernetes management required."},
  {id:6,domain:1,topic:"Azure Container Apps",type:"single",
    text:"Your Azure Container App must scale to zero when there is no traffic and scale up based on the number of messages in a Service Bus queue.\n\nWhich scaling rule type should you configure?",
    options:["HTTP scaling rule","Custom (KEDA) scaling rule with Service Bus scaler","Manual scaling with minimum replicas = 0","Azure Monitor autoscale rule"],correct:1,
    explanation:"Custom KEDA scaling rules support Service Bus queue length as a trigger. Container Apps natively integrates KEDA for event-driven autoscaling including scale-to-zero."},
  {id:7,domain:1,topic:"Azure Container Apps",type:"single",
    text:"You deploy two revisions of a Container App. You want 80% of traffic to go to the stable revision and 20% to the new revision.\n\nWhich feature should you configure?",
    options:["Deployment slots","Traffic splitting between revisions","Azure Front Door weighted routing","KEDA scaling rule"],correct:1,
    explanation:"Container Apps supports traffic splitting across revisions natively — set percentage weights per revision for canary or blue-green deployments."},
  {id:8,domain:1,topic:"Azure Container Apps",type:"multi",
    text:"Your Container App needs to communicate with another Container App in the same environment without going through the public internet.\n\nWhich TWO features enable this? (Choose 2)",
    options:["Dapr service invocation","Internal ingress with container app environment DNS","Public ingress with IP whitelisting","Azure Private Link"],correct:[0,1],
    explanation:"Dapr service invocation provides service-to-service communication. Internal ingress makes apps reachable only within the Container Apps environment via internal DNS."},
  {id:9,domain:1,topic:"Container Images & ACR",type:"single",
    text:"You need to automatically rebuild and push a container image whenever code is committed to your GitHub repository.\n\nWhich ACR feature should you use?",
    options:["ACR webhooks","ACR Tasks with a source trigger","ACR geo-replication","ACR content trust"],correct:1,
    explanation:"ACR Tasks supports source triggers that watch a Git repo for commits and automatically run a build task, pushing the updated image to the registry."},
  {id:10,domain:1,topic:"Azure Container Instances",type:"single",
    text:"Your ACI container group needs to persist data across container restarts.\n\nWhat should you mount?",
    options:["Azure Blob Storage as a tmpfs volume","Azure File Share as a volume mount","A local SSD volume","An Azure Managed Disk"],correct:1,
    explanation:"ACI supports mounting Azure File Shares as volumes. Data persists across container restarts. Blob Storage and Managed Disks are not directly mountable in ACI."},

  // ── 1.2 App Service Web Apps (10) ──
  {id:11,domain:1,topic:"App Service Web Apps",type:"single",
    text:"You need to deploy a new version of your App Service with zero downtime. You must validate the new version before routing all traffic.\n\nWhat should you do?",
    options:["Use FTP to replace files","Create a deployment slot, deploy to it, then swap","Stop the app, deploy, restart","Deploy directly to production via CI/CD"],correct:1,
    explanation:"Deployment slots allow deploy-to-staging, validate, then swap with production. The swap is instant and reversible."},
  {id:12,domain:1,topic:"App Service Web Apps",type:"single",
    text:"You need to gradually shift 20% of production traffic to a new version in a staging slot.\n\nWhich feature?",
    options:["Deployment slot swap","Traffic routing (Testing in Production)","Azure Traffic Manager","DNS round-robin"],correct:1,
    explanation:"Traffic routing allows percentage-based routing between production and staging slots without a full swap."},
  {id:13,domain:1,topic:"App Service Web Apps",type:"single",
    text:"During peak hours CPU exceeds 80%. You need the app to add instances when CPU > 70% and remove them when CPU < 40%.\n\nWhat should you configure?",
    options:["Scale up to higher tier","Custom autoscale rules with CPU metric","Azure Load Balancer health probes","Deployment slots"],correct:1,
    explanation:"Custom autoscale defines scale-out/in rules based on metrics like CPU with configurable thresholds and cooldown periods."},
  {id:14,domain:1,topic:"App Service Web Apps",type:"single",
    text:"Your App Service must load different configuration values per deployment slot (dev, staging, prod).\n\nHow?",
    options:["Environment variables in Dockerfile","Mark settings as 'Deployment slot setting'","Store all in appsettings.json","Azure DevOps variable groups"],correct:1,
    explanation:"'Deployment slot setting' makes the value sticky to the slot — it doesn't swap with the app code."},
  {id:15,domain:1,topic:"App Service Web Apps",type:"multi",
    text:"After swapping slots, you discover a bug. You need to roll back immediately.\n\nWhich TWO statements are true? (Choose 2)",
    options:["Swap back by performing another swap","Previous version remains in staging slot after swap","You must redeploy from source control","Swap operations are irreversible"],correct:[0,1],
    explanation:"After swap, the previous production version sits in the staging slot. Swapping again rolls back instantly."},
  {id:16,domain:1,topic:"App Service Web Apps",type:"single",
    text:"You need background tasks to continue running even when no HTTP requests are active.\n\nWhat should you enable?",
    options:["Always On","Free tier plan","Custom health check","ARR Affinity"],correct:0,
    explanation:"Always On prevents the app from unloading when idle, keeping WebJobs and background tasks running."},
  {id:17,domain:1,topic:"App Service Web Apps",type:"single",
    text:"You need to enable diagnostic logging to troubleshoot HTTP 500 errors in your App Service.\n\nWhich log type provides detailed error information?",
    options:["Application logging","Web server logging","Detailed error messages","Failed request tracing"],correct:3,
    explanation:"Failed request tracing provides detailed XML traces for each failed request, including the IIS pipeline steps — the most comprehensive diagnostic for HTTP errors."},
  {id:18,domain:1,topic:"App Service Web Apps",type:"single",
    text:"Your App Service needs to call Azure SQL and Key Vault over private endpoints, not the public internet.\n\nWhich feature?",
    options:["Hybrid Connections","Regional VNet Integration","Service Endpoints","IP-based access restrictions"],correct:1,
    explanation:"Regional VNet Integration routes outbound traffic through a VNet, enabling access to private endpoints."},
  {id:19,domain:1,topic:"App Service Web Apps",type:"single",
    text:"You need to enforce TLS 1.2 as the minimum version and redirect all HTTP traffic to HTTPS for your App Service.\n\nWhich TWO settings should you configure?",
    options:["Set Minimum TLS Version to 1.2 and enable HTTPS Only","Configure a WAF rule to block TLS 1.0","Set CORS to allow HTTPS only","Enable client certificate authentication"],correct:0,
    explanation:"Set Minimum TLS Version to 1.2 in TLS/SSL settings and enable HTTPS Only to redirect HTTP→HTTPS automatically."},
  {id:20,domain:1,topic:"App Service Web Apps",type:"single",
    text:"You deploy a containerized app to App Service. The container needs to read environment variables set in App Service configuration.\n\nHow are these exposed to the container?",
    options:["As files in /config directory","As environment variables injected at runtime","Via a mounted Key Vault volume","Through the App Service REST API only"],correct:1,
    explanation:"App Service injects all app settings and connection strings as environment variables into the container at runtime."},

  // ── 1.3 Azure Functions (10) ──
  {id:21,domain:1,topic:"Azure Functions",type:"single",
    text:"You are developing a Function that processes orders from a queue. It must scale automatically based on queue depth with no idle cost.\n\nWhich hosting plan?",
    options:["Consumption plan","Dedicated plan with Always On","Premium plan","AKS"],correct:0,
    explanation:"Consumption plan scales automatically on queue depth and charges only during execution."},
  {id:22,domain:1,topic:"Azure Functions",type:"single",
    text:"You need to orchestrate a long-running workflow: call three APIs sequentially, wait for human approval, send notification.\n\nWhich feature?",
    options:["Timer trigger","Durable Functions orchestrator","Queue chain","HTTP trigger with retry"],correct:1,
    explanation:"Durable Functions orchestrators can call activities sequentially, wait for external events, and manage long-running stateful workflows."},
  {id:23,domain:1,topic:"Azure Functions",type:"single",
    text:"Your Function reads from Cosmos DB and writes to Blob Storage. You want to configure this declaratively without SDK code.\n\nWhat should you use?",
    options:["Cosmos DB SDK and Blob SDK in code","Input binding for Cosmos DB, output binding for Blob","Durable Functions entity","Logic App connector"],correct:1,
    explanation:"Input and output bindings declaratively connect to data sources. Cosmos DB input binding reads data; Blob output binding writes — no SDK code needed."},
  {id:24,domain:1,topic:"Azure Functions",type:"single",
    text:"Your timer-triggered Function must run every weekday at 8:00 AM UTC.\n\nWhich CRON expression? (Azure Functions uses 6-field CRON)",
    options:["0 0 8 * * 1-5","0 8 * * 1-5","0 0 8 * * *","8 0 * * MON-FRI"],correct:0,
    explanation:"6-field: {sec} {min} {hour} {day} {month} {day-of-week}. '0 0 8 * * 1-5' = Mon-Fri at 08:00:00 UTC."},
  {id:25,domain:1,topic:"Azure Functions",type:"single",
    text:"Processing an image takes 15 minutes. Your Consumption plan function times out.\n\nWhat should you do?",
    options:["Set functionTimeout to 30 min in host.json","Switch to Premium plan or use Durable Functions activity","Split into 15 one-minute functions","Use synchronous HTTP processing"],correct:1,
    explanation:"Consumption plan max is 10 minutes. Premium has no timeout limit. Durable Functions handle long-running work with checkpointing."},
  {id:26,domain:1,topic:"Azure Functions",type:"multi",
    text:"You deploy Functions using deployment slots. Certain settings must NOT swap between slots.\n\nWhich TWO actions? (Choose 2)",
    options:["Mark settings as 'Deployment slot settings' (sticky)","Use separate Key Vault references per slot","Put settings only in local.settings.json","Use identical settings across all slots"],correct:[0,1],
    explanation:"Sticky settings stay with their slot. Per-slot Key Vault references ensure each slot resolves to its own secrets."},
  {id:27,domain:1,topic:"Azure Functions",type:"single",
    text:"Your Function uses a Blob trigger but isn't firing for new blobs.\n\nMost likely cause?",
    options:["Storage account in different region","Blob receipts in azure-webjobs-hosts are corrupt","Function is on Consumption plan","Soft delete is enabled"],correct:1,
    explanation:"Blob triggers track processed blobs via receipts in azure-webjobs-hosts. Corrupt/deleted receipts cause missed triggers."},
  {id:28,domain:1,topic:"Azure Functions",type:"single",
    text:"You need a Function triggered by a webhook from a third-party service that sends JSON payloads via POST.\n\nWhich trigger type?",
    options:["HTTP trigger with POST method filter","Timer trigger","Event Grid trigger","Queue trigger"],correct:0,
    explanation:"HTTP trigger handles webhook scenarios. Configure it to accept POST requests and parse the JSON body."},
  {id:29,domain:1,topic:"Azure Functions",type:"single",
    text:"Your .NET 8 isolated process Function needs custom middleware for logging.\n\nWhere do you configure it?",
    options:["function.json per function","Program.cs using IFunctionsWorkerApplicationBuilder","host.json extensionBundle","Startup.cs with FunctionsStartup"],correct:1,
    explanation:"Isolated worker model uses Program.cs with IFunctionsWorkerApplicationBuilder.UseMiddleware(). FunctionsStartup is the in-process model."},
  {id:30,domain:1,topic:"Azure Functions",type:"single",
    text:"Your Function writes to a Cosmos DB container. You want the output binding to create the document automatically when the function returns.\n\nWhich attribute should you apply to the output parameter?",
    options:["[CosmosDBInput(...)]","[CosmosDBOutput(...)] on the return value or out parameter","[BlobOutput(...)]","[ServiceBusOutput(...)]"],correct:1,
    explanation:"[CosmosDBOutput] attribute on a return value or out parameter tells the Functions runtime to write the object to Cosmos DB after execution."},

  // ═══════════════════════════════════════════════════════════════════════
  // DOMAIN 2: DEVELOP FOR AZURE STORAGE (15-20%) — 20 questions
  // ═══════════════════════════════════════════════════════════════════════

  // ── 2.1 Cosmos DB (10) ──
  {id:31,domain:2,topic:"Cosmos DB",type:"single",
    text:"Queries always filter by userId. Each user has 5-50 documents.\n\nBest partition key?",
    options:["/id","/userId","/createdDate","/region"],correct:1,
    explanation:"/userId matches the primary query filter and provides even distribution with reasonable partition sizes."},
  {id:32,domain:2,topic:"Cosmos DB",type:"single",
    text:"90% reads, 10% writes, global users. Minimize latency and cost.\n\nWhich consistency level?",
    options:["Strong","Bounded Staleness","Session","Eventual"],correct:2,
    explanation:"Session provides read-your-own-writes per session. Cost-effective for read-heavy global workloads. Strong doubles RU cost."},
  {id:33,domain:2,topic:"Cosmos DB",type:"single",
    text:"You need to react to all inserts and updates in near-real-time and process them with an Azure Function.\n\nWhich feature?",
    options:["Stored procedures","Change Feed with Azure Functions trigger","Pre/post triggers","TTL policies"],correct:1,
    explanation:"Change Feed provides a sorted log of changes. The Cosmos DB Azure Functions trigger processes them automatically."},
  {id:34,domain:2,topic:"Cosmos DB",type:"multi",
    text:"Your app gets 429 (Request Rate Too Large) errors during peak hours.\n\nWhich TWO actions help? (Choose 2)",
    options:["Enable autoscale throughput","Optimize queries to reduce RU consumption","Change consistency to Strong","Reduce partition key cardinality"],correct:[0,1],
    explanation:"Autoscale adjusts RU/s dynamically. Query optimization reduces per-request RU cost. Strong consistency increases cost."},
  {id:35,domain:2,topic:"Cosmos DB",type:"single",
    text:"A stored procedure must update 5 documents atomically.\n\nWhich constraint must be met?",
    options:["Same database","Same container","Same logical partition","Same id value"],correct:2,
    explanation:"Stored procedures execute within a single logical partition. All documents must share the same partition key value."},
  {id:36,domain:2,topic:"Cosmos DB",type:"single",
    text:"You need to auto-delete documents 90 days after creation.\n\nWhich feature?",
    options:["Change Feed cleanup function","TTL set to 7776000 seconds","Logic App on schedule","Stored procedure on timer"],correct:1,
    explanation:"TTL automatically removes expired items. 90 days × 86400 = 7,776,000 seconds."},
  {id:37,domain:2,topic:"Cosmos DB",type:"single",
    text:"You want to update a single field on a document while minimizing RU consumption.\n\nWhich SDK operation?",
    options:["ReplaceItemAsync with full document","PatchItemAsync with specific path operation","DeleteItemAsync then CreateItemAsync","ReadItemAsync then UpsertItemAsync"],correct:1,
    explanation:"PatchItemAsync performs partial updates on specific JSON paths without reading/replacing the full document, saving RUs."},
  {id:38,domain:2,topic:"Cosmos DB",type:"single",
    text:"Your Cosmos DB SDK code creates a CosmosClient for each request.\n\nWhat problem does this cause?",
    options:["Increased consistency","Socket exhaustion and high latency","Improved throughput","Lower RU consumption"],correct:1,
    explanation:"CosmosClient should be a singleton. Creating one per request exhausts sockets and TCP connections, causing high latency and failures."},
  {id:39,domain:2,topic:"Cosmos DB",type:"single",
    text:"You need to read a single document by its id and partition key.\n\nWhich SDK method provides the lowest RU cost?",
    options:["container.GetItemQueryIterator with SELECT * WHERE id = @id","container.ReadItemAsync<T>(id, partitionKey)","container.GetItemLinqQueryable<T>()","container.ReadManyItemsAsync()"],correct:1,
    explanation:"Point read via ReadItemAsync is always 1 RU for a 1KB document. Query-based reads cost significantly more RUs."},
  {id:40,domain:2,topic:"Cosmos DB",type:"single",
    text:"Your Change Feed processor loses its lease and another instance picks up. You notice duplicate processing.\n\nHow should you handle this?",
    options:["Disable Change Feed","Implement idempotent processing in the delegate","Increase lease duration to prevent handover","Use Strong consistency"],correct:1,
    explanation:"Change Feed guarantees at-least-once delivery. Your processing logic must be idempotent to handle duplicates during lease transfers."},

  // ── 2.2 Blob Storage (10) ──
  {id:41,domain:2,topic:"Blob Storage",type:"single",
    text:"Provide a third-party vendor temporary read access to a specific blob for 24 hours without sharing your account key.\n\nWhat to use?",
    options:["Account access key","SAS token with read permission and 24-hour expiry","Azure AD role assignment","Public access level = Blob"],correct:1,
    explanation:"SAS provides granular, time-limited access to specific resources without exposing account keys."},
  {id:42,domain:2,topic:"Blob Storage",type:"single",
    text:"You must store medical images that cannot be modified or deleted for 7 years.\n\nWhich feature?",
    options:["Cool tier","Immutable storage with time-based retention","Soft delete with 7-year retention","Blob versioning"],correct:1,
    explanation:"Immutable storage (WORM) prevents modification and deletion until the retention period expires."},
  {id:43,domain:2,topic:"Blob Storage",type:"multi",
    text:"Lifecycle management: move to Cool after 30 days, Archive after 90 days, delete after 365 days.\n\nWhich TWO rule actions? (Choose 2)",
    options:["tierToCool after 30 days and tierToArchive after 90 days","delete after 365 days","enableAutoTiering","Set default tier to Archive"],correct:[0,1],
    explanation:"Lifecycle management supports tierToCool, tierToArchive, and delete actions based on last modified date."},
  {id:44,domain:2,topic:"Blob Storage",type:"single",
    text:"A user-delegation SAS is more secure than a service SAS.\n\nWhat backs a user-delegation SAS?",
    options:["Storage account access key","Azure AD credentials","Stored access policy","Managed identity client secret"],correct:1,
    explanation:"User-delegation SAS is signed with Azure AD credentials. Revoke the AD token, not the entire storage key."},
  {id:45,domain:2,topic:"Blob Storage",type:"single",
    text:"You uploaded a blob to Archive tier and need to read it immediately.\n\nWhat must you do first?",
    options:["Change account tier to Hot","Rehydrate the blob to Hot or Cool","Download directly","Copy to new account"],correct:1,
    explanation:"Archive blobs are offline. Rehydrate first: standard takes up to 15 hours, high-priority under 1 hour."},
  {id:46,domain:2,topic:"Blob Storage",type:"single",
    text:"You need to set custom metadata on a blob after upload using the .NET SDK.\n\nWhich method should you call?",
    options:["blobClient.SetMetadataAsync(metadata)","blobClient.UploadAsync() with metadata parameter","blobClient.SetPropertiesAsync()","blobClient.SetTagsAsync()"],correct:0,
    explanation:"SetMetadataAsync sets user-defined key-value pairs on an existing blob. Properties are system-defined (content-type, etc.). Tags are for index/query."},
  {id:47,domain:2,topic:"Blob Storage",type:"single",
    text:"You need to retrieve only the properties and metadata of a blob without downloading its content.\n\nWhich SDK method?",
    options:["blobClient.DownloadAsync()","blobClient.GetPropertiesAsync()","blobClient.ExistsAsync()","blobClient.OpenReadAsync()"],correct:1,
    explanation:"GetPropertiesAsync returns blob properties (content-type, size, tier) and metadata without downloading the content."},
  {id:48,domain:2,topic:"Blob Storage",type:"single",
    text:"You want to trigger a Function on every blob creation with minimal latency.\n\nWhich approach is fastest?",
    options:["Blob trigger (polling)","Event Grid trigger with BlobCreated filter","Timer trigger listing blobs","Queue message from app"],correct:1,
    explanation:"Event Grid fires BlobCreated events in near-real-time (<1s). Blob trigger polls with higher latency."},
  {id:49,domain:2,topic:"Blob Storage",type:"single",
    text:"Your application uses the BlobContainerClient to list all blobs in a container with 100,000 items. The operation times out.\n\nWhat should you do?",
    options:["Increase the timeout","Use GetBlobsAsync() with pagination (AsPages)","Switch to a Premium storage account","Use a different SDK"],correct:1,
    explanation:"GetBlobsAsync().AsPages(pageSizeHint) returns blobs in pages, avoiding loading all 100K items into memory at once."},
  {id:50,domain:2,topic:"Blob Storage",type:"single",
    text:"You need to copy a blob between two storage accounts in different regions using server-side copy.\n\nWhich method should you use?",
    options:["blobClient.StartCopyFromUriAsync(sourceUri)","Download then upload manually","Use AzCopy locally","Azure Data Factory pipeline"],correct:0,
    explanation:"StartCopyFromUriAsync initiates an asynchronous server-side copy. Azure handles the data transfer between accounts without downloading locally."},

  // ═══════════════════════════════════════════════════════════════════════
  // DOMAIN 3: IMPLEMENT AZURE SECURITY (15-20%) — 20 questions
  // ═══════════════════════════════════════════════════════════════════════

  // ── 3.1 Authentication & Authorization (10) ──
  {id:51,domain:3,topic:"Microsoft Identity Platform & MSAL",type:"single",
    text:"Your SPA needs Azure AD authentication protecting against code interception.\n\nWhich flow?",
    options:["Implicit grant","Authorization Code with PKCE","Resource Owner Password","Client Credentials"],correct:1,
    explanation:"Auth Code with PKCE is the recommended flow for SPAs. Implicit is deprecated."},
  {id:52,domain:3,topic:"Microsoft Identity Platform & MSAL",type:"single",
    text:"Your daemon app (no user interaction) must call Microsoft Graph.\n\nWhich OAuth 2.0 flow?",
    options:["Authorization Code with PKCE","Client Credentials","Implicit grant","Device Code"],correct:1,
    explanation:"Client Credentials flow is for daemon/service applications authenticating as the application itself."},
  {id:53,domain:3,topic:"Microsoft Identity Platform & MSAL",type:"single",
    text:"You need to acquire tokens silently using MSAL after the user has signed in.\n\nWhich method first?",
    options:["acquireTokenPopup()","acquireTokenSilent()","acquireTokenByCode()","loginRedirect()"],correct:1,
    explanation:"acquireTokenSilent() checks cache and refreshes silently. Fall back to interactive only on InteractionRequired error."},
  {id:54,domain:3,topic:"Microsoft Entra ID",type:"single",
    text:"Users should sign in with personal Microsoft, Google, and local email/password.\n\nWhich service?",
    options:["Entra ID single-tenant","Entra ID multi-tenant","Azure AD B2C","Azure AD B2B"],correct:2,
    explanation:"B2C supports social identity providers, local accounts, and custom policies for consumer-facing apps."},
  {id:55,domain:3,topic:"Microsoft Entra ID",type:"multi",
    text:"Your web app calls Microsoft Graph on behalf of the signed-in user.\n\nWhich TWO configs? (Choose 2)",
    options:["Add Graph delegated permissions in app registration","Generate a client secret or certificate","Enable public client flows","Set to single-tenant only"],correct:[0,1],
    explanation:"Delegated permissions define app capabilities on behalf of users. Client secret/certificate authenticates the app to the token endpoint."},
  {id:56,domain:3,topic:"Microsoft Entra ID",type:"single",
    text:"Your multi-tenant SaaS must restrict sign-in to approved tenants.\n\nWhat should you implement?",
    options:["Single-tenant registration","Validate 'tid' claim against allow-list","Block via Conditional Access","Use B2C"],correct:1,
    explanation:"In a multi-tenant app, validate the tenant ID ('tid') claim in the JWT against your approved list."},
  {id:57,domain:3,topic:"Shared Access Signatures",type:"single",
    text:"You generate a service SAS and need the ability to revoke it before expiry without rotating the storage key.\n\nWhat should you associate it with?",
    options:["A stored access policy","An Azure AD group","A managed identity","A CORS rule"],correct:0,
    explanation:"A stored access policy on the container lets you modify or revoke the SAS by updating/deleting the policy without rotating keys."},
  {id:58,domain:3,topic:"Microsoft Graph",type:"single",
    text:"Your app needs to read the signed-in user's profile and calendar events.\n\nWhich Microsoft Graph permission type should you request?",
    options:["Application permissions","Delegated permissions","Admin-only permissions","Guest permissions"],correct:1,
    explanation:"Delegated permissions operate on behalf of the signed-in user. Application permissions act as the app itself without a user context."},
  {id:59,domain:3,topic:"Microsoft Graph",type:"single",
    text:"Your server-side app needs to read all users' profiles in the tenant without user sign-in.\n\nWhich permission type and consent?",
    options:["Delegated permissions with user consent","Application permissions with admin consent","Delegated permissions with admin consent","No permissions needed"],correct:1,
    explanation:"Reading all users requires application-level User.Read.All permission, which requires admin consent since there's no user context."},
  {id:60,domain:3,topic:"Microsoft Identity Platform & MSAL",type:"single",
    text:"Your API exposes custom scopes like 'Orders.Read'. Where do you define them?",
    options:["Client app's API permissions","API app's 'Expose an API' section","Conditional Access","appsettings.json"],correct:1,
    explanation:"Custom scopes are defined under 'Expose an API' in the API's app registration. Client apps request them under 'API permissions'."},

  // ── 3.2 Secure Azure Solutions (10) ──
  {id:61,domain:3,topic:"Key Vault",type:"single",
    text:"Your app reads secrets at startup. You need auto-refresh without restart.\n\nWhat to implement?",
    options:["Cache permanently","Key Vault references in App Configuration with dynamic refresh","Environment variables","Poll Key Vault every second"],correct:1,
    explanation:"App Configuration with Key Vault references and sentinel key refresh detects changes and updates without restart."},
  {id:62,domain:3,topic:"Key Vault",type:"single",
    text:"You need to encrypt data with a customer-managed key.\n\nWhich Key Vault object?",
    options:["Secret","Key","Certificate","Managed Storage Account"],correct:1,
    explanation:"Keys support cryptographic operations: encrypt, decrypt, sign, verify. Secrets store strings; certificates manage X.509."},
  {id:63,domain:3,topic:"Key Vault",type:"single",
    text:"You accidentally deleted a secret. Which feature must have been enabled before deletion to recover it?",
    options:["Access policy with Recover","Soft delete","Purge protection","RBAC"],correct:1,
    explanation:"Soft delete retains deleted items for a configurable period, enabling recovery."},
  {id:64,domain:3,topic:"Managed Identities",type:"single",
    text:"Your App Service needs to access Key Vault without managing credentials.\n\nRecommended approach?",
    options:["Store Key Vault key in App Settings","Enable system-assigned managed identity with Key Vault access policy","Create service principal with secret","Use SAS for Key Vault"],correct:1,
    explanation:"Managed identity provides an Azure AD identity automatically — no credentials to manage or rotate."},
  {id:65,domain:3,topic:"Managed Identities",type:"single",
    text:"Your Azure Function needs to access both Key Vault and Azure SQL using the same identity.\n\nWhich managed identity type should you use?",
    options:["System-assigned only","User-assigned managed identity","Both system and user-assigned","Service principal with certificate"],correct:1,
    explanation:"User-assigned managed identity can be shared across resources and assigned to both Key Vault and SQL access policies with a single identity."},
  {id:66,domain:3,topic:"Managed Identities",type:"multi",
    text:"You enable system-assigned managed identity on an App Service to access Azure SQL without stored credentials.\n\nWhich TWO steps are required? (Choose 2)",
    options:["Enable system-assigned managed identity on the App Service","Create a contained database user mapped to the managed identity in SQL","Store the SQL password in Key Vault","Add a firewall rule for the App Service IP"],correct:[0,1],
    explanation:"Enable managed identity, then create a contained DB user mapped to it. This eliminates credential storage entirely."},
  {id:67,domain:3,topic:"Azure App Configuration",type:"single",
    text:"You need to manage feature flags that control which features are enabled for specific user groups.\n\nWhich service?",
    options:["Azure Key Vault","Azure App Configuration with feature management","Azure DevOps variable groups","App Service app settings"],correct:1,
    explanation:"App Configuration provides native feature flag management with targeting filters for user groups, percentages, and custom conditions."},
  {id:68,domain:3,topic:"Azure App Configuration",type:"single",
    text:"Your app uses App Configuration. You need to trigger a refresh of all cached settings when a specific key changes.\n\nWhat should you configure?",
    options:["Poll every second","Register a sentinel key and configure refresh on that key","Restart the app on every change","Use Event Grid notifications only"],correct:1,
    explanation:"Sentinel key pattern: register one key to watch. When it changes, all cached settings refresh. Efficient polling with configurable interval."},
  {id:69,domain:3,topic:"Key Vault",type:"multi",
    text:"Deleted secrets must not be permanently purged for 90 days.\n\nWhich TWO features? (Choose 2)",
    options:["Soft delete with 90-day retention","Purge protection","RBAC mode","Network ACLs"],correct:[0,1],
    explanation:"Soft delete retains items. Purge protection prevents permanent deletion during the retention period."},
  {id:70,domain:3,topic:"Key Vault",type:"single",
    text:"You need to use a TLS certificate stored in Key Vault for your App Service custom domain.\n\nHow should you bind it?",
    options:["Download PFX and upload manually","Create a Key Vault certificate reference in App Service TLS settings","Store the certificate as a Key Vault secret","Use a self-signed certificate"],correct:1,
    explanation:"App Service can reference certificates directly from Key Vault. When the certificate auto-renews in Key Vault, App Service picks up the new version."},

  // ═══════════════════════════════════════════════════════════════════════
  // DOMAIN 4: MONITOR & TROUBLESHOOT (5-10%) — 8 questions
  // ═══════════════════════════════════════════════════════════════════════
  {id:71,domain:4,topic:"Application Insights",type:"single",
    text:"Track custom business metrics (orders/minute, revenue/region).\n\nWhich telemetry method?",
    options:["TrackException()","TrackEvent() with custom properties and metrics","TrackTrace()","TrackPageView()"],correct:1,
    explanation:"TrackEvent() with custom properties (region) and metrics (orderCount, revenue) captures business telemetry."},
  {id:72,domain:4,topic:"Application Insights",type:"single",
    text:"Your distributed app spans Functions, App Service, and a third-party API. You need end-to-end request tracing.\n\nWhich feature?",
    options:["Availability Tests","Distributed Tracing with operation correlation","Live Metrics","Smart Detection"],correct:1,
    explanation:"Distributed Tracing propagates operation_Id across services, showing the full request chain in the Application Map."},
  {id:73,domain:4,topic:"Application Insights",type:"single",
    text:"Alert when average API response time exceeds 2 seconds over 5 minutes.\n\nWhat to create?",
    options:["Availability Test","Azure Monitor Metric Alert on request duration","Smart Detection rule","Log Analytics alert"],correct:1,
    explanation:"Metric Alert on 'Server response time' > 2000ms with 5-minute aggregation window provides proactive alerting."},
  {id:74,domain:4,topic:"Application Insights",type:"single",
    text:"Reduce Application Insights costs while keeping all error telemetry.\n\nWhich feature?",
    options:["Disable entirely","Adaptive sampling","Daily cap = 0 GB","Export all to Blob"],correct:1,
    explanation:"Adaptive sampling reduces volume of routine telemetry while preserving 100% of errors and exceptions."},
  {id:75,domain:4,topic:"Application Insights",type:"single",
    text:"You need to verify your web app is reachable from multiple global locations every 5 minutes.\n\nWhich feature?",
    options:["Live Metrics Stream","URL ping availability test","Distributed Tracing","Application Map"],correct:1,
    explanation:"URL ping tests check endpoint availability from multiple Azure regions at configured intervals and alert on failures."},
  {id:76,domain:4,topic:"Application Insights",type:"single",
    text:"You need to query Application Insights data programmatically for a custom dashboard.\n\nWhich query language?",
    options:["SQL","KQL via Log Analytics API","GraphQL","OData"],correct:1,
    explanation:"Application Insights stores data in Log Analytics workspace. Query using KQL programmatically via the REST API."},
  {id:77,domain:4,topic:"Application Insights",type:"single",
    text:"You add Application Insights SDK to your ASP.NET Core app. You see requests but no dependency tracking.\n\nWhat is missing?",
    options:["The Application Insights connection string","EnableDependencyTrackingTelemetryModule in service configuration","A custom TelemetryInitializer","The TrackDependency() call on every outbound request"],correct:1,
    explanation:"The dependency tracking module must be registered. In ASP.NET Core, services.AddApplicationInsightsTelemetry() usually enables it, but custom configurations may need explicit module registration."},
  {id:78,domain:4,topic:"Application Insights",type:"single",
    text:"You need to instrument a JavaScript SPA with Application Insights for tracking page views and AJAX failures.\n\nWhat should you add?",
    options:["Server-side Application Insights SDK only","Application Insights JavaScript SDK (@microsoft/applicationinsights-web)","Azure Monitor REST API calls from the browser","TrackPageView() in the ASP.NET backend"],correct:1,
    explanation:"The JavaScript SDK (@microsoft/applicationinsights-web) provides client-side telemetry: page views, AJAX calls, exceptions, and user behavior."},

  // ═══════════════════════════════════════════════════════════════════════
  // DOMAIN 5: CONNECT TO & CONSUME AZURE SERVICES (20-25%) — 24 questions
  // ═══════════════════════════════════════════════════════════════════════

  // ── 5.1 API Management (8) ──
  {id:79,domain:5,topic:"API Management",type:"single",
    text:"Limit consumers to 100 calls per minute per subscription key.\n\nWhich policy?",
    options:["<ip-filter>","<rate-limit-by-key>","<quota-by-key>","<validate-jwt>"],correct:1,
    explanation:"rate-limit-by-key applies a sliding window rate limit per key. Quota limits total calls over longer periods."},
  {id:80,domain:5,topic:"API Management",type:"single",
    text:"Remove sensitive fields (SSN, creditCard) from the backend response.\n\nWhich policy section?",
    options:["inbound","backend","outbound","on-error"],correct:2,
    explanation:"Outbound processes the response from backend before returning to the client."},
  {id:81,domain:5,topic:"API Management",type:"single",
    text:"Validate incoming JWT tokens from your Azure AD tenant.\n\nWhich policy?",
    options:["<authentication-basic>","<validate-jwt>","<check-header>","<ip-filter>"],correct:1,
    explanation:"validate-jwt checks issuer, audience, claims, and expiry against Azure AD's OpenID Connect metadata."},
  {id:82,domain:5,topic:"API Management",type:"multi",
    text:"Cache responses for 1 hour, varying by 'region' query parameter.\n\nWhich TWO policies? (Choose 2)",
    options:["<cache-lookup> vary-by-query-parameter='region' in inbound","<cache-store> duration=3600 in outbound","<rate-limit> in inbound","<set-header> in outbound"],correct:[0,1],
    explanation:"cache-lookup in inbound checks cache. cache-store in outbound saves the response for 3600 seconds."},
  {id:83,domain:5,topic:"API Management",type:"single",
    text:"Expose multiple backend microservices as a single unified API.\n\nWhich approach?",
    options:["Products","API revisions","Named values","set-backend-service policy with URL rewriting"],correct:3,
    explanation:"set-backend-service routes different paths to different backends, presenting one unified API surface."},
  {id:84,domain:5,topic:"API Management",type:"single",
    text:"Test a breaking API change without affecting existing consumers.\n\nWhich feature?",
    options:["API Revisions","API Versions","Policy fragments","Subscriptions"],correct:1,
    explanation:"Versions (v1, v2) support breaking changes while keeping old versions live. Revisions are for non-breaking changes."},
  {id:85,domain:5,topic:"API Management",type:"single",
    text:"Your APIM instance should only be accessible from within your VNet.\n\nWhich deployment mode?",
    options:["Developer tier","Internal virtual network mode","External virtual network mode","Consumption tier with IP filter"],correct:1,
    explanation:"Internal VNet mode deploys APIM gateway with only a private IP, accessible only from within the VNet or peered networks."},
  {id:86,domain:5,topic:"API Management",type:"single",
    text:"You need to create an APIM API definition from an existing REST API that has an OpenAPI specification.\n\nWhat should you do?",
    options:["Manually create each operation","Import the OpenAPI (Swagger) specification","Use the APIM SDK to generate operations","Create a Logic App connector"],correct:1,
    explanation:"APIM supports direct import of OpenAPI/Swagger specs, automatically creating all operations, schemas, and documentation."},

  // ── 5.2 Event-Based Solutions (8) ──
  {id:87,domain:5,topic:"Event Grid",type:"single",
    text:"You need to trigger a Function whenever a blob is uploaded to a specific container.\n\nWhich service routes this event?",
    options:["Event Hubs","Event Grid","Service Bus","Notification Hubs"],correct:1,
    explanation:"Event Grid natively integrates with Blob Storage BlobCreated events and routes them to subscribers like Functions."},
  {id:88,domain:5,topic:"Event Grid",type:"single",
    text:"Your Event Grid subscription must only receive events for blobs in 'invoices/' prefix with .pdf extension.\n\nWhat to configure?",
    options:["Custom topic with filter","Subject filtering: beginsWith and endsWith","Function that filters after receiving all events","Service Bus SQL filter"],correct:1,
    explanation:"Event Grid subscriptions support subject filtering with beginsWith and endsWith operators."},
  {id:89,domain:5,topic:"Event Grid",type:"single",
    text:"You publish events to a custom Event Grid topic. How does the subscriber verify events are legitimate?",
    options:["IP whitelisting","Webhook validation handshake","Encrypt payload with shared key","Use system topics only"],correct:1,
    explanation:"Event Grid sends a validation event during subscription creation. The subscriber must echo the validationCode to complete the handshake."},
  {id:90,domain:5,topic:"Event Grid",type:"single",
    text:"You need to react to Azure resource state changes (VM created, key regenerated) without custom event publishing.\n\nWhich Event Grid feature?",
    options:["Custom topics","System topics","Event domains","Partner topics"],correct:1,
    explanation:"System topics are auto-created for Azure resources and emit events on resource state changes."},
  {id:91,domain:5,topic:"Event Hubs",type:"single",
    text:"Process 1 million events/second from IoT devices with ordered processing per device.\n\nWhich service?",
    options:["Event Grid","Event Hubs with partitions","Service Bus Queue","Queue Storage"],correct:1,
    explanation:"Event Hubs handles millions of events/second. Using device ID as partition key ensures per-device ordering."},
  {id:92,domain:5,topic:"Event Hubs",type:"single",
    text:"You need to capture all Event Hub events for auditing without affecting consumer throughput.\n\nWhich feature?",
    options:["Event Hubs Capture","Consumer group cloning","Event Grid subscription","Diagnostic logging"],correct:0,
    explanation:"Capture saves all events to Blob Storage or Data Lake in Avro format automatically, without affecting consumers."},
  {id:93,domain:5,topic:"Event Hubs",type:"single",
    text:"Your EventProcessorClient fails processing a batch. What should the error handler do?",
    options:["Crash the app","Log error and do NOT checkpoint","Checkpoint regardless of error","Skip and notify"],correct:1,
    explanation:"Not checkpointing ensures failed events are re-delivered on the next iteration. Checkpointing on failure means data loss."},
  {id:94,domain:5,topic:"Event Hubs",type:"single",
    text:"You have 32 partitions in an Event Hub. What is the maximum number of concurrent consumers in a single consumer group?",
    options:["1","16","32","Unlimited"],correct:2,
    explanation:"Each partition can have at most one active consumer per consumer group. 32 partitions = max 32 concurrent consumers."},

  // ── 5.3 Message-Based Solutions (8) ──
  {id:95,domain:5,topic:"Service Bus",type:"single",
    text:"You need pub-sub where a single message goes to multiple independent consumers.\n\nWhich entity?",
    options:["Queue","Topic with subscriptions","Relay","Dead-letter queue"],correct:1,
    explanation:"Topics with subscriptions: each subscription gets a copy of every published message."},
  {id:96,domain:5,topic:"Service Bus",type:"multi",
    text:"Messages must be processed exactly once in FIFO order.\n\nWhich TWO features? (Choose 2)",
    options:["Sessions","Duplicate detection","Auto-forwarding","Partitioning"],correct:[0,1],
    explanation:"Sessions guarantee FIFO per session ID. Duplicate detection prevents double processing."},
  {id:97,domain:5,topic:"Service Bus",type:"single",
    text:"A message fails after 10 delivery attempts.\n\nWhere does it go?",
    options:["Permanently deleted","Dead-letter queue","Back to sender","Stays at queue head"],correct:1,
    explanation:"After exceeding MaxDeliveryCount, messages move to the dead-letter sub-queue for inspection."},
  {id:98,domain:5,topic:"Service Bus",type:"single",
    text:"Schedule a message for delivery at a specific future time.\n\nWhich property?",
    options:["TimeToLive","ScheduledEnqueueTimeUtc","SessionId","CorrelationId"],correct:1,
    explanation:"ScheduledEnqueueTimeUtc defers message visibility until the specified UTC time."},
  {id:99,domain:5,topic:"Service Bus",type:"single",
    text:"Your topic has 3 subscriptions. Subscription A should only get messages where priority = 'high'.\n\nWhat to create?",
    options:["Correlation filter","SQL filter: priority = 'high'","Custom consumer that discards","Event Grid filter"],correct:1,
    explanation:"SQL filters on subscriptions evaluate message application properties using SQL-like syntax."},
  {id:100,domain:5,topic:"Azure Queue Storage",type:"single",
    text:"You need a simple, cost-effective queue for decoupling components. Messages are under 64 KB and you need no advanced features.\n\nWhich service?",
    options:["Azure Service Bus","Azure Queue Storage","Azure Event Hubs","Azure Event Grid"],correct:1,
    explanation:"Queue Storage provides simple, low-cost queuing. For messages < 64 KB without sessions, transactions, or dead-lettering, it's the cheapest option."},
  {id:101,domain:5,topic:"Azure Queue Storage",type:"single",
    text:"Your Queue Storage message becomes visible again after 30 seconds even though processing takes 2 minutes.\n\nWhat should you adjust?",
    options:["Message TTL","Visibility timeout","Dequeue count","Queue metadata"],correct:1,
    explanation:"Visibility timeout determines how long a dequeued message stays invisible. Set it longer than your processing time to prevent duplicate processing."},
  {id:102,domain:5,topic:"Azure Queue Storage",type:"single",
    text:"What is the maximum size of a single message in Azure Queue Storage?",
    options:["8 KB","64 KB","256 KB","1 MB"],correct:1,
    explanation:"Azure Queue Storage supports messages up to 64 KB. For larger payloads, store the data in Blob and put the blob reference in the queue message."},
];

const TOPICS = [...new Set(FULL_BANK.map(q => q.topic))];
const EXAM_SIZE = 55;

function pickExam(seed) {
  // Weighted selection: pick questions proportional to domain weights
  const byDomain = {};
  FULL_BANK.forEach(q => { if(!byDomain[q.domain]) byDomain[q.domain]=[]; byDomain[q.domain].push(q); });
  const targets = { 1: 16, 2: 10, 3: 10, 4: 5, 5: 14 }; // ~55 total
  let x = seed || Date.now();
  const shuffle = arr => { const a=[...arr]; for(let i=a.length-1;i>0;i--){x=(x*1664525+1013904223)&0x7fffffff;const j=x%(i+1);[a[i],a[j]]=[a[j],a[i]];} return a; };
  let result = [];
  Object.entries(targets).forEach(([d, n]) => {
    const pool = shuffle(byDomain[parseInt(d)] || []);
    result.push(...pool.slice(0, n));
  });
  return shuffle(result);
}

const AI_PROMPT = `You are an Azure AZ-204 exam expert using the January 2026 syllabus. Generate exactly 55 scenario-based questions as a JSON array.

Domains & weights:
1. Compute Solutions (25-30%): Containers/ACR/ACI/Container Apps, App Service, Azure Functions
2. Azure Storage (15-20%): Cosmos DB SDK/consistency/change feed, Blob Storage SDK/lifecycle/metadata
3. Azure Security (15-20%): MSAL/Entra ID/SAS/Microsoft Graph, Key Vault/App Configuration/Managed Identities
4. Monitor & Troubleshoot (5-10%): Application Insights metrics/traces/availability tests
5. Azure Services (20-25%): API Management policies, Event Grid/Event Hubs, Service Bus/Queue Storage

Return ONLY a valid JSON array. No markdown. Each element:
{"id":<n>,"domain":<1-5>,"topic":"<topic>","type":"single"|"multi","text":"<scenario>","options":["A","B","C","D"],"correct":<0-based index>|[<indices>],"explanation":"<why>"}
For "multi": correct is array of exactly 2 indices, mention "Choose 2" in text. Distribute: ~16 domain 1, ~10 domain 2, ~10 domain 3, ~5 domain 4, ~14 domain 5.`;

const PROVIDERS = {
  claude:{name:"Claude (Anthropic)",icon:"⬡",models:["claude-sonnet-4-20250514","claude-haiku-4-5-20251001"],default:"claude-sonnet-4-20250514",
    call:async(k,m)=>{const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":k,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:m,max_tokens:8192,system:AI_PROMPT,messages:[{role:"user",content:"Generate 55 AZ-204 exam questions now."}]})});if(!r.ok)throw new Error(`${r.status}: ${(await r.text()).slice(0,200)}`);return(await r.json()).content?.map(b=>b.text||"").join("")||"";}},
  openai:{name:"OpenAI",icon:"◈",models:["gpt-4o","gpt-4o-mini"],default:"gpt-4o-mini",
    call:async(k,m)=>{const r=await fetch("https://api.openai.com/v1/chat/completions",{method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${k}`},body:JSON.stringify({model:m,max_tokens:8192,messages:[{role:"system",content:AI_PROMPT},{role:"user",content:"Generate 55 AZ-204 questions."}]})});if(!r.ok)throw new Error(`${r.status}: ${(await r.text()).slice(0,200)}`);return(await r.json()).choices?.[0]?.message?.content||"";}},
  gemini:{name:"Google Gemini",icon:"◆",models:["gemini-2.0-flash","gemini-2.5-flash"],default:"gemini-2.0-flash",
    call:async(k,m)=>{const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${k}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({system_instruction:{parts:[{text:AI_PROMPT}]},contents:[{parts:[{text:"Generate 55 AZ-204 questions."}]}],generationConfig:{maxOutputTokens:8192}})});if(!r.ok)throw new Error(`${r.status}: ${(await r.text()).slice(0,200)}`);return(await r.json()).candidates?.[0]?.content?.parts?.map(p=>p.text||"").join("")||"";}}
};

// In-memory history (localStorage not available in sandbox; persists within session)
const loadHist=()=>{try{return JSON.parse(localStorage.getItem("az204v2")||"[]")}catch{return[];}};
const saveHist=h=>{try{localStorage.setItem("az204v2",JSON.stringify(h))}catch{}};
const isOk=(q,a)=>q.type==="multi"?a&&Array.isArray(a)&&a.length===q.correct.length&&a.every(x=>q.correct.includes(x)):a===q.correct;
const sc=(qs,ans)=>qs.filter(q=>isOk(q,ans[q.id])).length;
const ts=(qs,ans)=>{const t={};qs.forEach(q=>{if(!t[q.topic])t[q.topic]={c:0,n:0};t[q.topic].n++;if(isOk(q,ans[q.id]))t[q.topic].c++;});return t;};
const ds=(qs,ans)=>{const d={};qs.forEach(q=>{const dn=DOMAINS[q.domain-1]?.name||`Domain ${q.domain}`;if(!d[dn])d[dn]={c:0,n:0,color:DOMAINS[q.domain-1]?.color||"#888"};d[dn].n++;if(isOk(q,ans[q.id]))d[dn].c++;});return d;};
const fmt=s=>`${Math.floor(s/3600)}:${String(Math.floor((s%3600)/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
const scc=p=>p>=700?"#34D399":p>=500?"#FBBF24":"#FB7185";

export default function App(){
  const[screen,setScreen]=useState("home");
  const[qs,setQs]=useState([]);
  const[ci,setCi]=useState(0);
  const[ans,setAns]=useState({});
  const[flags,setFlags]=useState(new Set());
  const[time,setTime]=useState(9000);
  const[done,setDone]=useState(false);
  const[hist,setHist]=useState(()=>loadHist());
  const[nav,setNav]=useState(false);
  const[seed,setSeed]=useState(1);
  const[modal,setModal]=useState(false);
  const[prov,setProv]=useState("claude");
  const[mod,setMod]=useState("");
  const[key,setKey]=useState("");
  const[loading,setLoading]=useState(false);
  const[err,setErr]=useState("");
  const[prog,setProg]=useState("");
  const[filter,setFilter]=useState("all");
  const tmr=useRef(null);

  useEffect(()=>{saveHist(hist);},[hist]);
  useEffect(()=>{if(screen==="exam"&&!done){tmr.current=setInterval(()=>setTime(t=>{if(t<=1){clearInterval(tmr.current);return 0;}return t-1;}),1000);return()=>clearInterval(tmr.current);}},[screen,done]);
  useEffect(()=>{if(time===0&&screen==="exam"&&!done)finish();},[time]);

  const start=useCallback((cq)=>{const q=cq||pickExam(seed);setQs(q);setCi(0);setAns({});setFlags(new Set());setTime(9000);setDone(false);setNav(false);setScreen("exam");},[seed]);
  const finish=useCallback(()=>{clearInterval(tmr.current);setDone(true);const s2=sc(qs,ans),p=Math.round((s2/qs.length)*1000);setHist(h=>[...h,{d:new Date().toISOString(),s:s2,n:qs.length,p,pass:p>=700,t:9000-time,ts:ts(qs,ans),ds:ds(qs,ans)}]);setScreen("results");},[ans,qs,time]);
  const pick=(qId,v,multi)=>{if(done)return;setAns(p=>{if(multi){const c=p[qId]||[];return{...p,[qId]:c.includes(v)?c.filter(x=>x!==v):[...c,v]};}return{...p,[qId]:v};});};
  const flag=id=>setFlags(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n;});

  const aiGen=async()=>{
    if(!key.trim()){setErr("API key is required");return;}
    setLoading(true);setErr("");setProg("Connecting...");
    try{const P=PROVIDERS[prov],m=mod||P.default;setProg(`Generating via ${P.name} (${m})...`);
      const raw=await P.call(key.trim(),m);setProg("Parsing...");
      const match=raw.match(/\[[\s\S]*\]/);const parsed=JSON.parse(match?match[0]:raw);
      if(!Array.isArray(parsed)||parsed.length<10)throw new Error("Too few questions");
      const v=parsed.slice(0,55).map((q,i)=>({id:2000+i,domain:q.domain||1,topic:q.topic||"Azure Functions",type:Array.isArray(q.correct)?"multi":"single",text:q.text||"",options:Array.isArray(q.options)?q.options:["A","B","C","D"],correct:q.correct??0,explanation:q.explanation||""}));
      setModal(false);setKey("");start(v);
    }catch(e){setErr(e.message||"Failed");}finally{setLoading(false);setProg("");}};

  const cnt=qs.filter(q=>{const a=ans[q.id];return a!==undefined&&(q.type==="multi"?a.length>0:true);}).length;
  const last=hist[hist.length-1];

  const Modal2=modal&&(
    <div style={V.ov} onClick={()=>!loading&&setModal(false)}><div style={V.md} onClick={e=>e.stopPropagation()}>
      <div style={V.mh}><span style={V.mt}>Generate New Exam with AI</span>{!loading&&<button style={V.cl} onClick={()=>setModal(false)}>✕</button>}</div>
      <div style={V.f}><label style={V.lb}>AI Provider</label>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>{Object.entries(PROVIDERS).map(([k,p])=>(
          <button key={k} style={{...V.pb,...(prov===k?V.pa:{})}} onClick={()=>{setProv(k);setMod("");setErr("");}}>
            <span style={{fontSize:18,color:"#7C5CFC"}}>{p.icon}</span><span>{p.name}</span></button>
        ))}</div></div>
      <div style={V.f}><label style={V.lb}>Model</label>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{PROVIDERS[prov].models.map(m=>(
          <button key={m} style={{...V.mb,...((mod||PROVIDERS[prov].default)===m?V.ma:{})}} onClick={()=>setMod(m)}>{m}</button>
        ))}</div></div>
      <div style={V.f}><label style={V.lb}>API Key</label>
        <input type="password" value={key} onChange={e=>setKey(e.target.value)} placeholder={`Enter ${PROVIDERS[prov].name} API key`} style={V.inp} disabled={loading}/>
        <div style={{fontSize:11,color:"#78716C",marginTop:6,fontStyle:"italic"}}>Used only for this request. Never stored.</div></div>
      {err&&<div style={V.er}>{err}</div>}
      {prog&&<div style={V.pr}>{prog}</div>}
      <button style={{...V.gb,opacity:loading?0.6:1}} onClick={aiGen} disabled={loading}>{loading?"Generating...":"Generate 55 Questions"}</button>
    </div></div>);

  // ═══ HOME ═══
  if(screen==="home")return(
    <div style={C.root}><style>{`@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Instrument+Sans:wght@400;500;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0;}`}</style>
      {Modal2}<div style={C.bg}/>
      <div style={C.hw}>
        <div style={C.lr}><span style={C.lh}>⬡</span><span style={C.ll}>AZ-204</span></div>
        <h1 style={C.h1}>Azure Developer Associate</h1>
        <p style={C.sub}>Exam Simulator &bull; January 2026 Syllabus</p>
        <div style={C.sg}>{[["55","Questions"],["150","Minutes"],["700","Pass Score"],["5","Domains"]].map(([v,l])=>(
          <div key={l} style={C.sc}><div style={C.sv}>{v}</div><div style={C.sl}>{l}</div></div>
        ))}</div>
        <div style={C.gl}>
          <div style={C.sh}>Exam Domains</div>
          {DOMAINS.map(d=>(
            <div key={d.name} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
              <span style={{fontSize:13,color:"#FFFFFE"}}>{d.name}</span>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,fontWeight:600,color:d.color}}>{Math.round(d.weight*100)}%</span>
            </div>
          ))}
        </div>
        <div style={{...C.gl,marginTop:16}}>
          <div style={C.sh}>Topics</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>{TOPICS.map(t=><span key={t} style={C.tg}>{t}</span>)}</div>
        </div>
        <div style={{display:"flex",gap:12,marginTop:28}}>
          <button style={C.bp} onClick={()=>start()}>Start Exam</button>
          <button style={C.ba} onClick={()=>setModal(true)}><span style={{fontSize:16}}>✦</span> AI Generate</button>
        </div>
        {hist.length>0&&(
          <div style={{...C.gl,marginTop:24}}>
            <div style={C.sh}>History ({hist.length})</div>
            {hist.slice(-8).reverse().map((a,i)=>(
              <div key={i} style={C.hr}><span style={{color:"#A5A0C2",fontSize:13}}>{new Date(a.d).toLocaleDateString()} {new Date(a.d).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</span>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:600,color:scc(a.p)}}>{a.p}/1000 {a.pass?"✓ PASS":"✗ FAIL"}</span></div>
            ))}
            <button style={{...C.bs,marginTop:12,width:"100%",padding:8,fontSize:12}} onClick={()=>setHist([])}>Clear History</button>
          </div>
        )}
      </div></div>);

  // ═══ EXAM ═══
  if(screen==="exam"){
    const q=qs[ci];if(!q)return null;const multi=q.type==="multi",fl=flags.has(q.id),tw=time<600;
    return(<div style={C.root}><style>{`@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Instrument+Sans:wght@400;500;600;700&display=swap');*{box-sizing:border-box;}`}</style>
      <div style={C.tb}>
        <div style={C.tl}><span style={{...C.lh,fontSize:20}}>⬡</span><span style={C.bl}>Q {ci+1}/{qs.length}</span></div>
        <div style={C.tc}><div style={{...C.tm,color:tw?"#FB7185":"#FFFFFE"}}>{fmt(time)}</div></div>
        <div style={C.tr}><span style={C.bm}>{cnt}/{qs.length}</span><button style={C.nt} onClick={()=>setNav(!nav)}>{nav?"✕":"☰"}</button></div>
      </div>
      {nav&&<div style={C.np}>
        <div style={C.ng}>{qs.map((q2,i)=>{const a=ans[q2.id],has=a!==undefined&&(q2.type==="multi"?a.length>0:true),fl2=flags.has(q2.id),cur=i===ci;
          return <button key={i} onClick={()=>{setCi(i);setNav(false);}} style={{...C.nb,background:cur?"#0066FF":has?"#0D2818":"#1A1929",border:fl2?"2px solid #FBBF24":cur?"2px solid #0066FF":"2px solid #252340",color:cur?"#FFF":has?"#34D399":"#A5A0C2"}}>{i+1}</button>;
        })}</div>
        <div style={{display:"flex",gap:16,fontSize:11,color:"#78716C",fontFamily:"'JetBrains Mono',monospace"}}><span><span style={{color:"#34D399"}}>■</span> Answered</span><span><span style={{color:"#0066FF"}}>■</span> Current</span><span><span style={{color:"#FBBF24"}}>□</span> Flagged</span></div>
      </div>}
      <div style={C.eb}>
        <div style={C.qc}>
          <div style={C.qt}><span style={C.badge}>{q.topic}</span><span style={{...C.badge,background:DOMAINS[q.domain-1]?.color+"22",color:DOMAINS[q.domain-1]?.color,marginLeft:8}}>D{q.domain}</span>
            <button style={{background:"none",border:"none",fontSize:13,cursor:"pointer",fontFamily:"'Instrument Sans'",color:fl?"#FBBF24":"#A5A0C2",marginLeft:"auto"}} onClick={()=>flag(q.id)}>{fl?"⚑ Flagged":"⚐ Flag"}</button></div>
          {multi&&<div style={C.mh}>Select all that apply</div>}
          <div style={C.qx}>{q.text}</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {q.options.map((o,i)=>{const L=String.fromCharCode(65+i),sel=multi?(ans[q.id]||[]).includes(i):ans[q.id]===i;
              return <button key={i} style={{...C.ob,borderColor:sel?"#0066FF":"#252340",background:sel?"rgba(0,102,255,0.1)":"#12111F"}} onClick={()=>pick(q.id,i,multi)}>
                <span style={{...C.ol,background:sel?"#0066FF":"#252340",color:sel?"#FFF":"#A5A0C2"}}>{L}</span>
                <span style={C.ot}>{o}</span></button>;})}
          </div>
        </div>
        <div style={C.bn}>
          <button style={{...C.bs,opacity:ci===0?0.3:1}} disabled={ci===0} onClick={()=>setCi(c=>c-1)}>← Previous</button>
          {ci===qs.length-1?<button style={C.bf} onClick={finish}>Finish Exam</button>:<button style={C.bs} onClick={()=>setCi(c=>c+1)}>Next →</button>}
        </div>
      </div></div>);}

  // ═══ RESULTS ═══
  if(screen==="results"&&last){
    const domainData=last.ds||ds(qs,ans);const topicData=last.ts||ts(qs,ans);
    return(<div style={C.root}><style>{`@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Instrument+Sans:wght@400;500;600;700&display=swap');*{box-sizing:border-box;}`}</style>
      {Modal2}<div style={C.bg}/>
      <div style={C.rw}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{display:"inline-block",padding:"6px 28px",borderRadius:100,fontFamily:"'JetBrains Mono',monospace",fontSize:14,fontWeight:600,letterSpacing:4,border:"2px solid",marginBottom:16,background:last.pass?"#052E16":"#450A0A",borderColor:last.pass?"#15803D":"#B91C1C"}}>{last.pass?"PASSED":"FAILED"}</div>
          <div style={{fontSize:64,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",lineHeight:1,color:scc(last.p)}}>{last.p}<span style={{fontSize:22,color:"#78716C",fontWeight:400}}>/1000</span></div>
          <div style={{fontSize:14,color:"#A5A0C2",marginTop:8}}>{last.s}/{last.n} correct &bull; {fmt(last.t)} elapsed &bull; Attempt #{hist.length}</div>
        </div>
        <div style={{position:"relative",marginBottom:44}}>
          <div style={{height:12,background:"rgba(255,255,255,0.08)",borderRadius:6,position:"relative"}}>
            <div style={{height:"100%",borderRadius:6,width:`${last.p/10}%`,background:last.pass?"#15803D":"#B91C1C",transition:"width 0.8s cubic-bezier(0.34,1.56,0.64,1)"}}/>
            <div style={{position:"absolute",left:"70%",top:-4,height:20,width:2,background:"#FBBF24"}}/>
          </div>
          <div style={{position:"absolute",left:"70%",top:20,transform:"translateX(-50%)",fontSize:11,color:"#FBBF24",fontFamily:"'JetBrains Mono',monospace"}}>700 pass</div>
        </div>
        {/* Domain breakdown */}
        <div style={{...C.gl,marginBottom:16}}>
          <div style={C.sh}>Domain Breakdown</div>
          {Object.entries(domainData).sort((a,b)=>(a[1].c/a[1].n)-(b[1].c/b[1].n)).map(([name,d])=>{
            const p=Math.round((d.c/d.n)*100);
            return <div key={name} style={{marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:13,color:"#FFFFFE"}}>{name}</span>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,fontWeight:600,color:p>=70?"#34D399":p>=50?"#FBBF24":"#FB7185"}}>{d.c}/{d.n} ({p}%)</span>
              </div>
              <div style={{height:6,background:"#252340",borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",borderRadius:3,width:`${p}%`,background:d.color||"#7C5CFC",opacity:p>=70?1:0.6}}/></div>
            </div>;})}
        </div>
        {/* Topic breakdown */}
        <div style={{...C.gl,marginBottom:24}}>
          <div style={C.sh}>Topic Breakdown</div>
          {Object.entries(topicData).filter(([,v])=>v.n>0).sort((a,b)=>(a[1].c/a[1].n)-(b[1].c/b[1].n)).map(([t,d])=>{
            const p=Math.round((d.c/d.n)*100);
            return <div key={t} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                <span style={{fontSize:12,color:"#C4C0DA"}}>{t}</span>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:600,color:p>=70?"#34D399":p>=50?"#FBBF24":"#FB7185"}}>{d.c}/{d.n}</span>
              </div>
              <div style={{height:4,background:"#252340",borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",borderRadius:2,width:`${p}%`,background:p>=70?"#15803D":p>=50?"#D97706":"#B91C1C"}}/></div>
            </div>;})}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <button style={C.bp} onClick={()=>{setFilter("all");setScreen("review");}}>Review Answers</button>
          <div style={{display:"flex",gap:12}}>
            <button style={{...C.bs,flex:1}} onClick={()=>{setSeed(s=>s+1);start();}}>Retake (Shuffle)</button>
            <button style={{...C.ba,flex:1}} onClick={()=>setModal(true)}><span style={{fontSize:14}}>✦</span> AI Generate</button>
          </div>
          <button style={{...C.bs,borderColor:"#78716C"}} onClick={()=>setScreen("home")}>Back to Home</button>
        </div>
      </div></div>);}

  // ═══ REVIEW ═══
  if(screen==="review"){
    const fqs=filter==="all"?qs:filter==="wrong"?qs.filter(q=>!isOk(q,ans[q.id])):qs.filter(q=>isOk(q,ans[q.id]));
    return(<div style={C.root}><style>{`@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Instrument+Sans:wght@400;500;600;700&display=swap');*{box-sizing:border-box;}`}</style>
      <div style={C.tb}>
        <div style={C.tl}><span style={{...C.lh,fontSize:20}}>⬡</span><span style={C.bl}>Review ({fqs.length})</span></div>
        <div style={C.tr}>
          <div style={{display:"flex",gap:4}}>{["all","wrong","correct"].map(f=>(
            <button key={f} style={{background:filter===f?"#7C5CFC":"transparent",border:"1px solid "+(filter===f?"#7C5CFC":"rgba(255,255,255,0.12)"),borderRadius:8,padding:"6px 12px",fontSize:12,color:filter===f?"#FFF":"#A5A0C2",cursor:"pointer",fontFamily:"'Instrument Sans'"}} onClick={()=>setFilter(f)}>{f==="all"?"All":f==="wrong"?"✗ Wrong":"✓ Correct"}</button>
          ))}</div>
          <button style={C.bs} onClick={()=>setScreen("results")}>← Results</button>
        </div>
      </div>
      <div style={{maxWidth:820,margin:"0 auto",padding:"24px 20px 60px"}}>
        {fqs.map(q=>{const a=ans[q.id],multi=q.type==="multi",ok=isOk(q,a);
          return <div key={q.id} style={{background:"rgba(255,255,255,0.05)",backdropFilter:"blur(12px)",borderRadius:16,padding:24,border:"1px solid rgba(255,255,255,0.08)",borderLeft:`4px solid ${ok?"#15803D":"#B91C1C"}`,marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12,flexWrap:"wrap"}}>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:600,color:"#A5A0C2"}}>Q{qs.indexOf(q)+1}</span>
              <span style={C.badge}>{q.topic}</span>
              <span style={{marginLeft:"auto",fontFamily:"'JetBrains Mono',monospace",fontSize:12,fontWeight:600,color:ok?"#34D399":"#FB7185"}}>{ok?"✓ Correct":"✗ Incorrect"}</span>
            </div>
            <div style={{fontSize:14,lineHeight:1.7,color:"#FFFFFE",whiteSpace:"pre-wrap",marginBottom:12}}>{q.text}</div>
            <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:16}}>
              {q.options.map((o,i)=>{const L=String.fromCharCode(65+i),ws=multi?(a||[]).includes(i):a===i,ic=multi?q.correct.includes(i):q.correct===i;
                let bg="#12111F",bd="#252340";if(ic){bg="#052E16";bd="#15803D";}else if(ws){bg="#450A0A";bd="#B91C1C";}
                return <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:8,border:`1px solid ${bd}`,background:bg}}>
                  <span style={{...C.ol,width:24,height:24,fontSize:11,lineHeight:"24px",background:ic?"#15803D":ws?"#B91C1C":"#252340",color:"#FFF"}}>{L}</span>
                  <span style={{fontSize:13,color:"#FFFFFE",lineHeight:1.5}}>{o}</span>
                  {ic&&<span style={{marginLeft:"auto",color:"#34D399",fontSize:11,flexShrink:0}}>✓ Correct</span>}
                  {ws&&!ic&&<span style={{marginLeft:"auto",color:"#FB7185",fontSize:11,flexShrink:0}}>Your answer</span>}
                </div>;})}
            </div>
            <div style={{background:"rgba(0,0,0,0.3)",borderRadius:10,padding:16,fontSize:13,lineHeight:1.7,color:"#C4C0DA",border:"1px solid rgba(255,255,255,0.06)"}}>
              <strong style={{color:"#FBBF24"}}>Explanation: </strong>{q.explanation}</div>
          </div>;})}
        <button style={{...C.bp,margin:"32px auto",display:"block",maxWidth:300}} onClick={()=>setScreen("results")}>Back to Results</button>
      </div></div>);}
  return null;
}

const C={
  root:{fontFamily:"'Instrument Sans','Segoe UI',sans-serif",background:"#0D0B1A",color:"#FFFFFE",minHeight:"100vh",position:"relative",WebkitFontSmoothing:"antialiased"},
  bg:{position:"fixed",inset:0,zIndex:0,pointerEvents:"none",background:"radial-gradient(ellipse at 20% 50%,#1A1145 0%,transparent 50%),radial-gradient(ellipse at 80% 20%,#0B2A3C 0%,transparent 50%),radial-gradient(ellipse at 50% 80%,#1E0A3C 0%,transparent 50%),#0D0B1A"},
  hw:{maxWidth:720,margin:"0 auto",padding:"48px 24px",position:"relative",zIndex:1},
  lr:{display:"flex",alignItems:"center",gap:10,marginBottom:32},
  lh:{fontSize:28,color:"#7C5CFC",fontWeight:700},
  ll:{fontFamily:"'JetBrains Mono',monospace",fontSize:18,fontWeight:600,color:"#A5A0C2",letterSpacing:3},
  h1:{fontSize:34,fontWeight:700,margin:"0 0 4px",letterSpacing:-0.5,lineHeight:1.15},
  sub:{fontSize:18,color:"#A5A0C2",margin:"0 0 36px",fontWeight:400},
  sg:{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:28},
  sc:{background:"rgba(255,255,255,0.06)",backdropFilter:"blur(20px) saturate(1.8)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:16,padding:"20px 16px",textAlign:"center"},
  sv:{fontFamily:"'JetBrains Mono',monospace",fontSize:28,fontWeight:600,color:"#7C5CFC"},
  sl:{fontSize:11,color:"#A5A0C2",marginTop:4,textTransform:"uppercase",letterSpacing:1.5},
  gl:{background:"rgba(255,255,255,0.06)",backdropFilter:"blur(20px) saturate(1.8)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:20,padding:24},
  sh:{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"#A5A0C2",textTransform:"uppercase",letterSpacing:2,marginBottom:14},
  tg:{background:"rgba(124,92,252,0.15)",color:"#B8A9FF",fontSize:12,padding:"5px 12px",borderRadius:100,fontWeight:500,border:"1px solid rgba(124,92,252,0.25)"},
  bp:{background:"#7C5CFC",color:"#FFF",border:"none",borderRadius:12,padding:"16px 32px",fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:"'Instrument Sans',sans-serif",flex:1},
  ba:{background:"linear-gradient(135deg,#7C5CFC 0%,#2DD4BF 100%)",color:"#FFF",border:"none",borderRadius:12,padding:"16px 24px",fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:"'Instrument Sans',sans-serif",display:"flex",alignItems:"center",gap:8,justifyContent:"center"},
  bs:{background:"transparent",color:"#FFFFFE",border:"2px solid rgba(255,255,255,0.15)",borderRadius:12,padding:"12px 24px",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"'Instrument Sans',sans-serif"},
  bf:{background:"#15803D",color:"#FFF",border:"none",borderRadius:12,padding:"12px 32px",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"'Instrument Sans',sans-serif"},
  hr:{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,0.08)"},
  tb:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 20px",background:"rgba(26,25,41,0.95)",backdropFilter:"blur(12px)",borderBottom:"1px solid rgba(255,255,255,0.08)",position:"sticky",top:0,zIndex:100},
  tl:{display:"flex",alignItems:"center",gap:12},tc:{position:"absolute",left:"50%",transform:"translateX(-50%)"},tr:{display:"flex",alignItems:"center",gap:12},
  bl:{fontFamily:"'JetBrains Mono',monospace",fontSize:13,color:"#A5A0C2",fontWeight:500},
  bm:{fontSize:12,color:"#A5A0C2",fontFamily:"'JetBrains Mono',monospace"},
  tm:{fontFamily:"'JetBrains Mono',monospace",fontSize:22,fontWeight:600,letterSpacing:2},
  nt:{background:"rgba(255,255,255,0.08)",border:"none",color:"#FFFFFE",fontSize:18,width:36,height:36,borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"},
  np:{background:"rgba(26,25,41,0.97)",backdropFilter:"blur(12px)",borderBottom:"1px solid rgba(255,255,255,0.08)",padding:20,position:"sticky",top:56,zIndex:99},
  ng:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(38px,1fr))",gap:5,marginBottom:10},
  nb:{width:"100%",aspectRatio:"1",borderRadius:8,fontSize:11,fontWeight:600,fontFamily:"'JetBrains Mono',monospace",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"},
  eb:{maxWidth:820,margin:"0 auto",padding:"24px 20px"},
  qc:{background:"rgba(255,255,255,0.05)",backdropFilter:"blur(20px)",border:"1px solid rgba(255,255,255,0.10)",borderRadius:20,padding:28,marginBottom:20},
  qt:{display:"flex",alignItems:"center",marginBottom:16},
  badge:{background:"rgba(124,92,252,0.15)",color:"#B8A9FF",fontSize:11,fontWeight:600,padding:"4px 12px",borderRadius:100,fontFamily:"'JetBrains Mono',monospace",textTransform:"uppercase",letterSpacing:0.5},
  mh:{background:"rgba(124,92,252,0.12)",color:"#B8A9FF",fontSize:12,fontWeight:600,padding:"6px 12px",borderRadius:6,marginBottom:16,display:"inline-block"},
  qx:{fontSize:15,lineHeight:1.75,color:"#FFFFFE",whiteSpace:"pre-wrap",marginBottom:24},
  ob:{display:"flex",alignItems:"flex-start",gap:12,padding:"14px 16px",borderRadius:12,border:"2px solid",cursor:"pointer",textAlign:"left",fontFamily:"'Instrument Sans',sans-serif",transition:"all 0.12s ease"},
  ol:{width:28,height:28,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:600,fontFamily:"'JetBrains Mono',monospace",flexShrink:0},
  ot:{fontSize:14,lineHeight:1.5,color:"#FFFFFE",paddingTop:3},
  bn:{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12},
  rw:{maxWidth:720,margin:"0 auto",padding:"48px 24px",position:"relative",zIndex:1},
};

const V={
  ov:{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20},
  md:{background:"#1A1929",borderRadius:24,padding:32,maxWidth:520,width:"100%",border:"1px solid rgba(255,255,255,0.12)",maxHeight:"90vh",overflowY:"auto"},
  mh:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28},
  mt:{fontSize:20,fontWeight:700,color:"#FFFFFE"},
  cl:{background:"none",border:"none",color:"#A5A0C2",fontSize:20,cursor:"pointer"},
  f:{marginBottom:24},
  lb:{display:"block",fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"#A5A0C2",textTransform:"uppercase",letterSpacing:1.5,marginBottom:10},
  pb:{display:"flex",alignItems:"center",gap:8,padding:"12px 18px",borderRadius:12,border:"2px solid #252340",background:"#12111F",color:"#A5A0C2",cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"'Instrument Sans',sans-serif",flex:"1 1 0"},
  pa:{borderColor:"#7C5CFC",background:"rgba(124,92,252,0.12)",color:"#FFFFFE"},
  mb:{padding:"8px 14px",borderRadius:8,border:"1px solid #252340",background:"#12111F",color:"#A5A0C2",cursor:"pointer",fontSize:12,fontFamily:"'JetBrains Mono',monospace",fontWeight:500},
  ma:{borderColor:"#2DD4BF",background:"rgba(45,212,191,0.1)",color:"#2DD4BF"},
  inp:{width:"100%",padding:"14px 16px",borderRadius:12,border:"2px solid #252340",background:"#12111F",color:"#FFFFFE",fontSize:14,fontFamily:"'JetBrains Mono',monospace",outline:"none",boxSizing:"border-box"},
  er:{background:"rgba(185,28,28,0.15)",border:"1px solid rgba(185,28,28,0.3)",borderRadius:10,padding:"10px 14px",fontSize:13,color:"#FB7185",marginBottom:16},
  pr:{background:"rgba(124,92,252,0.1)",border:"1px solid rgba(124,92,252,0.2)",borderRadius:10,padding:"10px 14px",fontSize:13,color:"#B8A9FF",marginBottom:16},
  gb:{width:"100%",background:"linear-gradient(135deg,#7C5CFC 0%,#2DD4BF 100%)",color:"#FFF",border:"none",borderRadius:12,padding:16,fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"'Instrument Sans',sans-serif"},
};