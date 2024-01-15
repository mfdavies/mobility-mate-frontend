import { useEffect, useState } from "react";
import { db, getCurrentUser } from "../../../../firebaseConfig";
import { Edit, Save, X, Plus } from "lucide-react";
import ExerciseListModal from "./ExerciseListModal";

const PatientDetails = ({ patientID }) => {
  const [patient, setPatient] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [patientExercises, setPatientExercises] = useState([]);
  const [convos, setConvos] = useState([]);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const fetchPatientDetails = async () => {
      const currentUser = await getCurrentUser();

      // Fetch patient details
      const patientRef = db
        .collection("practitioners")
        .doc(currentUser.uid)
        .collection("patients")
        .doc(patientID);

      const unsubscribePatient = patientRef.onSnapshot((doc) => {
        if (doc.exists) {
          const patientData = doc.data();
          setPatient(patientData);
          if (patientData.exerciseRoutine) {
            setPatientExercises(patientData.exerciseRoutine);
          }
          const conversationsRef = doc.ref.collection("conversations");
          conversationsRef.onSnapshot((snapshot) => {
            const sortedConvos = snapshot.docs
              .map((doc) => ({
                date: doc.data().date.toDate(),
                summary: doc.data().summary,
              }))
              .sort((a, b) => b.date - a.date); // Sort by date in ascending order
            setConvos(sortedConvos);
          });
        } else {
          console.error("Patient not found");
        }
      });

      // Fetch exercises
      const exercisesRef = db
        .collection("practitioners")
        .doc(currentUser.uid)
        .collection("exercises");

      const unsubscribeExercises = exercisesRef.onSnapshot((snapshot) => {
        setExercises(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        );
      });

      return () => {
        unsubscribePatient();
        unsubscribeExercises();
      };
    };

    fetchPatientDetails();
  }, [patientID]);

  // const handleAddExercises = async (selectedExercises) => {
  //   const currentUser = await getCurrentUser();
  //   const patientRef = db
  //     .collection("practitioners")
  //     .doc(currentUser.uid)
  //     .collection("patients")
  //     .doc(patientID);
  //   await patientRef.update({
  //     exerciseRoutine: selectedExercises,
  //   });

  //   setPatientExercises(selectedExercises);
  // };

  const handleAddExercise = (newExercise) => {
    const exercise = exercises.find((e) => e.title === newExercise.title);
    setPatientExercises((prev) => [...prev, exercise.id]);
  };

  const formatDate = (date) => {
    if (!date) return "";
    const day = date.getDate();
    const month = date.getMonth() + 1; // Months are zero-based
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${day}/${month}/${year} ${hours}:${
      minutes < 10 ? "0" : ""
    }${minutes}`;
  };

  const handleEditing = () => {
    setEditing((prev) => !prev);
  };

  return (
    <div className="w-full py-4 px-8 mt-4">
      {patient ? (
        <div>
          <h1 className="text-4xl font-bold mb-4">{patient.name}</h1>
          <div className="flex justify-between w-full text-gray-600 text-xl bg-gray-50 rounded-lg pl-2 pr-2">
            <p>{patientID}</p>
            <p>{patient.age} years old</p>
            <p>{patient.email}</p>
            <p>Last Login: {patient.lastLogin || "Never"}</p>
          </div>
          <div className="flex justify-between items-center w-full text-xl font-bold mt-10">
            <p>Exercise Routine</p>
            {editing ? (
              <div>
                <button
                  className="btn bg-dark-teal text-white"
                  onClick={() => handleEditing()}
                >
                  <Save />
                </button>
                <button className="btn" onClick={() => handleEditing()}>
                  <X />
                </button>
              </div>
            ) : (
              <button
                className={"btn bg-dark-teal text-white"}
                onClick={() => handleEditing()}
              >
                <Edit />
              </button>
            )}
          </div>
          {/* Display exercises in the patient's routine as cards */}
          <div className="bg-gray-50 rounded-lg mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 p-5">
              {patientExercises.length === 0 && !editing ? (
                <p className="text-gray-600">No exercises assigned 🥱</p>
              ) : (
                <>
                  {" "}
                  {patientExercises.map((exerciseId) => {
                    const exercise = exercises.find((e) => e.id === exerciseId);
                    return (
                      exercise && (
                        <div
                          key={exercise.id}
                          className="bg-white rounded-lg shadow-md p-4 flex flex-col"
                        >
                          <img
                            src={exercise.image}
                            alt={exercise.title}
                            className="w-80 h-32 sm:h-48 object-fit rounded-t-lg"
                          />
                          <h3 className="mt-2 font-bold text-lg">
                            {exercise.title}
                          </h3>
                          <div className="grid grid-cols-2 gap-4 p-2">
                            <div className="font-bold">Sets</div>
                            <div>{exercise.sets}</div>
                            <div className="font-bold">Reps</div>
                            <div>{exercise.reps}</div>
                            <div className="font-bold">Notes</div>
                            <div>{exercise.notes}</div>
                          </div>
                        </div>
                      )
                    );
                  })}
                  {editing && (
                    <button
                      className="btn bg-dark-teal text-white h-full"
                      onClick={() =>
                        document
                          .getElementById("exercise_list_modal")
                          .showModal()
                      }
                    >
                      <Plus size="64" />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
          <div>
            {convos && convos.length !== 0 ? (
              <div>
                <p className="flex justify-between w-full text-xl font-bold mt-10">
                  Conversation Summaries
                </p>
                <div className="flex justify-between w-full text-gray-600 text-xl font-bold bg-gray-50 rounded-lg pl-2 pr-2">
                  <p>Date</p>
                  <p>Summary</p>
                </div>
                {convos.map((convo, index) => (
                  <div
                    key={index}
                    className="flex justify-between w-full text-gray-600 text-xl bg-gray-50 rounded-lg pl-2 pr-2"
                  >
                    <p>{formatDate(convo.date)}</p>
                    <p>{convo.summary}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div></div>
            )}
          </div>
        </div>
      ) : (
        <p>Loading patient details...</p>
      )}

      <ExerciseListModal
        exercises={exercises}
        onAddExercises={handleAddExercise}
      />
    </div>
  );
};

export default PatientDetails;
