import { Bundle, ZObject } from "zapier-platform-core";

interface AddLabelRequestResponse {
  data?: { issueUpdate: { issue: { url: string }; success: boolean } };
  errors?: {
    message: string;
    extensions?: {
      userPresentableMessage?: string;
    };
  }[];
}

const addLabelRequest = async (z: ZObject, bundle: Bundle) => {
  const variables = {
    issueId: bundle.inputData.issue_id,
    labelId: bundle.inputData.label_id,
  };

  const query = `
    mutation IssueUpdate(
      $issueId: String!,
      $labelId: String!
    ) {
      issueUpdate(
        id: $issueId,
        input: {
          labelIds: [$labelId]
        }
      ) {
        success
        issue {
          id
          title
          labels { 
            nodes { id, name }
          }
        }
      }
    }`;

  const response = await z.request({
    url: "https://api.linear.app/graphql",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      authorization: bundle.authData.api_key,
    },
    body: {
      query,
      variables,
    },
    method: "POST",
  });

  const data = response.json as AddLabelRequestResponse;

  if (data.errors && data.errors.length) {
    const error = data.errors[0];
    throw new z.errors.Error(
      (error.extensions && error.extensions.userPresentableMessage) || error.message,
      "invalid_input",
      400
    );
  }

  if (data.data && data.data.issueUpdate && data.data.issueUpdate.success) {
    return data.data.issueUpdate.issue;
  } else {
    const error = data.errors ? data.errors[0].message : "Something went wrong";
    throw new z.errors.Error(`Failed to create an issue`, error, 400);
  }
};

export const addLabel = {
  key: "add_label",

  display: {
    hidden: false,
    important: true,
    description: "Add label to Linear issue",
    label: "Add label",
  },

  noun: "Issue",

  operation: {
    perform: addLabelRequest,

    inputFields: [
      {
        required: true,
        label: "Issue",
        key: "issue_id",
        helpText: "The issue to add the label to",
      },
      {
        required: true,
        label: "Label",
        helpText: "The label to add",
        key: "label_id",
      },
    ],
    sample: { data: { issueUpdate: { success: true } } },
  },
};
