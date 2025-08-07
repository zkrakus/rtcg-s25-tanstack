import {
  Link,
  redirect,
  useNavigate,
  useParams,
  useSubmit,
  useNavigation,
} from "react-router-dom";

import Modal from "../UI/Modal.jsx";
import EventForm from "./EventForm.jsx";
import { useQuery } from "@tanstack/react-query";
import { fetchEvent, queryClient, updateEvent } from "../../util/http.js";
// import LoadingIndicator from "../UI/LoadingIndicator.jsx";
import ErrorBlock from "../UI/ErrorBlock.jsx";

export default function EditEvent() {
  const navigate = useNavigate();
  const { state } = useNavigation();
  const { id } = useParams();
  const submit = useSubmit();

  // data will now prepopulate because of the loader
  const { data, isError, error } = useQuery({
    queryKey: ["events", { id }],
    queryFn: ({ siganl }) => fetchEvent({ siganl, id }),
    staleTime: 10 * 1000
  });

  // No need to mutate if using a submit action, but lose other benefits.
  // const { mutate } = useMutation({
  //   mutationFn: updateEvent,
  //   onMutate: async ({ event }) => {
  //     await queryClient.cancelQueries({ queryKey: ["events", id] }); // Cancels active queries against this key since they are about to be invalidated.
  //     const previousEvent = queryClient.getQueryData(["events", id]);

  //     queryClient.setQueryData(["events", id], event); // optimistic update.

  //     return { previousEvent }; // set context with previous event for rollback if necessary.
  //   },
  //   onError: (error, data, context) => {
  //     queryClient.setQueryData(["events", id], context.previousEvent); // Rolls back optimistic update.
  //   },
  //   onSettled: () => {
  //     // Called whenever mutation is done whether successful or not.
  //     queryClient.invalidateQueries(["events", id]); // Invalidate any components that are using this key. // Ensures other components sync if update is successful or not.
  //   },
  // });

  function handleSubmit(formData) {
    // mutate({ id, event: formData });
    // navigate("../");
    submit(formData, { method: "PUT" });
  }

  function handleClose() {
    navigate("../");
  }

  let content;

  // Will no longer be pending because we will start with data from the loader.
  // if (isPending) {
  //   content = (
  //     <div className="center">
  //       <LoadingIndicator />
  //     </div>
  //   );
  // }

  if (isError) {
    content = (
      <>
        <ErrorBlock
          title="Failed to load event"
          message={
            error.info?.message ||
            "Failed to load event. Please check your inputs and try again later."
          }
        />
        <div className="form-actions">
          <Link to="../" className="button">
            Okay
          </Link>
        </div>
      </>
    );
  }

  if (data) {
    content = (
      <EventForm inputData={data} onSubmit={handleSubmit}>
        {state === "submitting" ? (
          <p>Sending data...</p>
        ) : (
          <>
            <Link to="../" className="button-text">
              Cancel
            </Link>
            <button type="submit" className="button">
              Update
            </button>
          </>
        )}
      </EventForm>
    );
  }

  return <Modal onClose={handleClose}>{content}</Modal>;
}

export function loader({ params }) {
  return queryClient.fetchQuery({
    queryKey: ["events", params.id],
    queryFn: ({ siganl }) => fetchEvent({ siganl, id: params.id }),
  });
}

export async function action({ request, params }) {
  const formData = await request.formData();
  const updatedEventData = Object.fromEntries(formData);
  await updateEvent({ id: params.id, event: updatedEventData });
  queryClient.invalidateQueries(["events"]); // no optimistic updating in this case.
  return redirect("../");
}
