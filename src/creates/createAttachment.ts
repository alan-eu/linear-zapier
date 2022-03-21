import { Bundle, ZObject } from "zapier-platform-core";

interface createAttachmentRequestResponse {
  data?: { attachmentCreate: { success: boolean } };
  errors?: {
    message: string;
    extensions?: {
      userPresentableMessage?: string;
    };
  }[];
}

const createAttachmentRequest = async (z: ZObject, bundle: Bundle) => {
  const variables = {
    issueId: bundle.inputData.issue,
    url: bundle.inputData.url,
    title: bundle.inputData.title,
    subtitle: bundle.inputData.subtitle,
    metadata: bundle.inputData.metadata,
  };

  const query = `
    mutation attachmentCreate(
      $issueId: String!,
      $url: String!,
      $title: String!,
      $subtitle: String,
      $metadata: JSONObject
    ) {
      attachmentCreate(
        input: {
          issueId: $issueId,
          title: $title,
          subtitle: $subtitle,
          url: $url,
          metadata: $metadata
        }
      ) {
        success
      }
    }`;

  z.console.log(JSON.stringify(query));
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

  const data = response.json as createAttachmentRequestResponse;
  z.console.log(JSON.stringify(data));

  if (data.errors && data.errors.length) {
    const error = data.errors[0];
    throw new z.errors.Error(
      (error.extensions && error.extensions.userPresentableMessage) || error.message,
      "invalid_input",
      400
    );
  }

  if (data.data && data.data.attachmentCreate && data.data.attachmentCreate.success) {
    return data.data.attachmentCreate;
  } else {
    const error = data.errors ? data.errors[0].message : "Something went wrong2";
    throw new z.errors.Error(`Failed to create an attachment ${JSON.stringify(data)}`, "", 400);
  }
};

export const createAttachment = {
  key: "create_attachment",

  display: {
    hidden: false,
    important: true,
    label: "Creates attachment",
    description: "Creates a new attachment, or updates existing if the same url and issueId is used.",
  },

  noun: "Attachment",

  operation: {
    perform: createAttachmentRequest,

    inputFields: [
      {
        required: true,
        label: "Issue Id",
        helpText: "The issue to associate the attachment with.",
        key: "issue",
      },
      {
        required: true,
        label: "Title",
        helpText: "The attachment title",
        key: "title",
      },
      {
        required: false,
        label: "Subtitle",
        helpText: "The attachment subtitle",
        key: "subtitle",
      },
      {
        required: true,
        label: "url",
        helpText:
          "Attachment location which is also used as an unique identifier for the attachment. If another attachment is created with the same url value, existing record is updated instead",
        key: "url",
      },
      {
        required: false,
        label: "Metadata",
        helpText: "Attachment metadata object with string values",
        key: "metadata",
        dict: true,
      },
    ],
    sample: { data: { success: true } },
  },
};
