import { Link, useNavigate, useParams } from "react-router-dom";

import Modal from "../UI/Modal.jsx";
import EventForm from "./EventForm.jsx";
import { useMutation, useQuery } from "@tanstack/react-query";
import { fetchEvent, queryClient, updateEvent } from "../../util/http.js";
import LoadingIndicator from "../UI/LoadingIndicator.jsx";
import ErrorBlock from "../UI/ErrorBlock.jsx";

export default function EditEvent() {
  const { id } = useParams();

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["events", { id }],
    queryFn: ({ siganl }) => fetchEvent({ siganl, id }),
  });

  const { mutate } = useMutation({
    mutationFn: updateEvent,
    onMutate: async ({ event }) => {
      await queryClient.cancelQueries({ queryKey: ["events", id] }); // Cancels active queries against this key since they are about to be invalidated.
      const previousEvent = queryClient.getQueryData(["events", id]);

      queryClient.setQueryData(["events", id], event); // optimistic update.

      return { previousEvent }; // set context with previous event for rollback if necessary.
    },
    onError: (error, data, context) => {
      queryClient.setQueryData(["events", id], context.previousEvent); // Rolls back optimistic update.
    },
    onSettled: () => { // Called whenever mutation is done whether successful or not.
      queryClient.invalidateQueries(["events", id]); // Invalidate any components that are using this key. // Ensures other components sync if update is successful or not.
    }
  });

  const navigate = useNavigate();

  function handleSubmit(formData) {
    mutate({ id, event: formData });
    navigate("../");
  }

  function handleClose() {
    navigate("../");
  }

  let content;

  if (isPending) {
    content = (
      <div className="center">
        <LoadingIndicator />
      </div>
    );
  }

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
        <Link to="../" className="button-text">
          Cancel
        </Link>
        <button type="submit" className="button">
          Update
        </button>
      </EventForm>
    );
  }

  return <Modal onClose={handleClose}>{content}</Modal>;
}
