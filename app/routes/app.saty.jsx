
import { useLoaderData, useSearchParams, useFetcher } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  Button,
  DataTable,
  Pagination,
  InlineStack,
  Link,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { useEffect, useState } from "react";
import {
  ViewIcon, EditIcon, DeleteIcon
} from '@shopify/polaris-icons';



export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);

  let variables = { first: 100 };
  const response = await admin.graphql(`
    query PageList($first: Int) {
      pages(first: $first) {
        pageInfo {
            hasPreviousPage
            hasNextPage
            startCursor
            endCursor
        }
        edges {
          cursor
          node {
            id
            title
            handle
            
            
          }
        }
      }
    }
  `, { variables });

  const jsonData = await response.json();
  const pages = jsonData.data.pages.edges;



  //-----------------


  const responsePublicData = {};


  return { pages: pages, session: session }
};





export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const formData = await request.formData();
  const cursor = formData.get("cursor");
  const direction = formData.get("direction");

  // for next button --------------------
  if (direction == "next") {
    let variables = { first: 100, after: cursor };
    const response = await admin.graphql(`
    query getProducts($first: Int, $after: String) {
      products(first: $first, after: $after) {
        pageInfo {
            hasPreviousPage
            hasNextPage
            startCursor
            endCursor
        }
        edges {
          cursor
          node {
            id
            title
            handle
            status
            totalInventory
            images(first: 1) {
              nodes {
                url
              }
            }
            variants(first: 1) {
              nodes {
                price
              }
            }
            onlineStorePreviewUrl
          }
        }
      }
    }
  `, { variables });

    const jsonData = await response.json();

    return {
      products: jsonData.data.products.edges,
      pageInfo: jsonData.data.products.pageInfo,
    };
  }


  // for prives button -----

  if (direction == "prev") {
    let variables = { last: 10, before: cursor };
    const response = await admin.graphql(`
   query getProducts( $last: Int,  $before: String) {
      products( last: $last, before: $before) {
        pageInfo {
            hasPreviousPage
            hasNextPage
            startCursor
            endCursor
        }
        edges {
          cursor
          node {
            id
            title
            handle
            status
            totalInventory
            images(first: 1) {
              nodes {
                url
              }
            }
            variants(first: 1) {
              nodes {
                price
              }
            }
            onlineStorePreviewUrl
          }
        }
      }
    }
  `, { variables });

    const jsonData = await response.json();

    return {
      products: jsonData.data.products.edges,
      pageInfo: jsonData.data.products.pageInfo,
    };

  }

  if (direction == "delete") {
    const pageId = formData.get("pageId");
    const response = await admin.graphql(
      `#graphql
    mutation DeletePage($id: ID!) {
  pageDelete(id: $id) {
    deletedPageId
    userErrors {
      code
      field
      message
    }
  }
}`,
      {
        variables: {
          "id": pageId
        }
      });

    const data = await response.json();
    // const deleted = data;
    return { deleted: data }
  }


};


export default function AllProductShow22() {

  const { pages, session } = useLoaderData();
  const [pagesDataLoader, setPagestDataLoader] = useState([]);
  const fetcher = useFetcher();

  console.log("pages", pages);
  console.log("session", session)


  useEffect(() => {
    setPagestDataLoader(pages)
  }, [fetcher?.data?.deleted])







  const deletePageFun = (PageId) => {
    // alert(PageId)
    const formData = new FormData();
    formData.append("direction", "delete");
    formData.append("pageId", PageId);
    fetcher.submit(formData, { method: "post" });
  }



  const rows = pagesDataLoader.map((page) => [
    page.node.title,
    page.node.handle,
    page.node.id,
    <>
      <a target="blank" href={`https://${session.shop}/pages/${page.node.handle}`}><Button icon={ViewIcon} ></Button></a>    <Link url={`/app/updatePage/${page.node.id.split('/')[4]}`} ><Button icon={EditIcon} ></Button> </Link>
      <Button onClick={() => deletePageFun(page.node.id)} icon={DeleteIcon} ></Button>
    </>
  ]);






  // const nextProductsData = () => {
  //   const formData = new FormData();
  //   formData.append("cursor", pageinfoDataLoader?.endCursor ?? "");
  //   formData.append("direction", "next");
  //   fetcher.submit(formData, { method: "post" });
  // };

  // const prevProductsData = () => {
  //   const formData = new FormData();
  //   formData.append("cursor", pageinfoDataLoader?.startCursor ?? "");
  //   formData.append("direction", "prev");
  //   fetcher.submit(formData, { method: "post" });
  // };


  return (
    <Page title="All Products">
      <TitleBar title="All Products" />
      <Layout>
        <Layout.Section>
          <div >
            <p style={{ textAlign: "end", marginBottom: "20px" }}>
              <Link url="/app/createPage" removeUnderline> <Button variant="primary">
                Create new store Page
              </Button>
              </Link>
            </p>
          </div>

          <Card>
            <Text variant="headingLg" as="h2" alignment="start" padding="400">
              Pages  List
            </Text>
            <DataTable
              columnContentTypes={["text", "text", "text", "text"]}
              headings={["Title", "Handle", "Id", "Action"]}
              rows={rows}
              verticalAlign="middle"
            />


            {/* <InlineStack align="center" paddingBlockStart="400">
              <Button
                onClick={prevProductsData}
                disabled={!pageinfoDataLoader.hasPreviousPage || fetcher.state !== "idle"}
              >
                ⬅ Previous
              </Button>
              <Button
                onClick={nextProductsData}
                disabled={!pageinfoDataLoader.hasNextPage || fetcher.state !== "idle"}
              >
                Next ➡
              </Button>
            </InlineStack> */}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}


