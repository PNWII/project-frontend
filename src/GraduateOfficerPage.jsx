import NavbarGraduateOfficer from "./Components/NavbarGraduateOfficer";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import {
  Card,
  Col,
  Row,
  Button,
  Badge,
  Spinner,
  Modal,
  Form,
  InputGroup,
} from "react-bootstrap";
import SignatureCanvas from "react-signature-canvas";
import DocumentDetailsModal from "./Components/modals/DocumentDetailsModal";
import axios from "axios";
import { ButtonGroup } from "react-bootstrap";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

function GraduateOfficerPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "" });
  const [rejectFormData, setRejectFormData] = useState({ name: "" });
  const [approvalModal, setApprovalModal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [currentDoc, setCurrentDoc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [signature, setSignature] = useState("");
  const [rejectSignature, setRejectSignature] = useState(null);
  const sigCanvas = useRef();
  const [rejectModal, setRejectModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [documentsPerPage] = useState(18); // จำนวนเอกสารต่อหน้า

  const handleCloseDocModal = () => {
    setShowModal(false);
  };
  const handleCloseModal = () => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      comment: "",
      advisorMain: "",
      advisorMainCriteria: "",
      advisorSecond: "",
      advisorSecondCriteria: "",
      projectApprovalDate: "",
      gs13projectApprovalDocument: null,
      gs16OfficeThesisCertificateDoc: null,
      gs16OfficeGraduationApprovalReport: null,
      gs17OfficeMasterPlanOneApprovalDoc: null,
      gs19OfficeMasterPlanTwoApprovalDoc: null,
      gs23OfficeThesisDocDate: "",
      gs23OfficeCumulativeGPAStudent: "",
      gs23OfficeKnowledgeExamPass: "",
    }));
    setRejectFormData((prevRejectFormData) => ({
      ...prevRejectFormData,
      comment: "",
      advisorMain: "",
      advisorMainCriteria: "",
      advisorSecond: "",
      advisorSecondCriteria: "",
    }));
    setRejectSignature(null); // ลบลายมือชื่อ
    sigCanvas.current.clear(); // ล้างข้อมูลใน SignatureCanvas
    setSignature(null);
    setRejectModal(false);
    setApprovalModal(false);
  };

  const handleSignatureEnd = () => {
    setSignature(sigCanvas.current.toDataURL());
  };

  const handleClearSignature = () => {
    sigCanvas.current.clear();
    setSignature(null);
    setRejectSignature(null);
  };

  // Fetch documents from API
  const fetchDocuments = async () => {
    const teacherName = localStorage.getItem("teacherName");

    if (!teacherName) {
      setError("ชื่ออาจารย์ไม่ครบถ้วน");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        "http://localhost/TestPHP-API2/backend/get-related-reportsGraduateOfficer.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nameTeacher: teacherName }),
        }
      );

      const data = await response.json();
      console.log(data); // ตรวจสอบข้อมูลที่ได้จาก API

      if (data.documentsToSend && data.documentsToSend.length > 0) {
        const sortedDocuments = data.documentsToSend.sort(
          (a, b) => new Date(b.timeSubmit) - new Date(a.timeSubmit)
        );
        setDocuments(sortedDocuments);
        console.log(sortedDocuments); // แสดงใน console
      } else {
        setError("ไม่พบข้อมูล");
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("เกิดข้อผิดพลาดในการดึงข้อมูล");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const role = localStorage.getItem("role");
    const teacherName = localStorage.getItem("teacherName");
    if (teacherName) {
      setFormData((prevFormData) => ({
        ...prevFormData,
        name: teacherName,
      }));
      setRejectFormData((prevRejectFormData) => ({
        ...prevRejectFormData,
        name: teacherName,
      }));
    }

    if (
      !isLoggedIn ||
      role !== "เจ้าหน้าที่บัณฑิตศึกษาประจำคณะครุศาสตร์อุตสาหกรรม"
    ) {
      alert("คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
      navigate("/loginteacher");
    } else {
      fetchDocuments();
    }
  }, [navigate]);

  const handleReject = (doc) => {
    setCurrentDoc(doc);
    setRejectModal(true);
    console.log("Reject document", doc);
  };

  const handleRejectSignatureEnd = () => {
    const signatureData = sigCanvas.current.toDataURL();
    setRejectSignature(signatureData);
  };

  const handleSubmitReject = async () => {
    if (
      !currentDoc ||
      !rejectFormData.name ||
      !rejectFormData.comment ||
      !rejectSignature
    ) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    const teacherId = localStorage.getItem("teacherId");

    const payload = {
      id: currentDoc.id,
      type: currentDoc.docName,
      action: "reject",
      name: rejectFormData?.name?.trim() || "",
      comment: rejectFormData?.comment?.trim() || "",
      advisorMain: rejectFormData?.advisorMain?.trim() || "",
      advisorMainCriteria: rejectFormData?.advisorMainCriteria?.trim() || "",
      advisorSecond: rejectFormData?.advisorSecond?.trim() || "",
      advisorSecondCriteria:
        rejectFormData?.advisorSecondCriteria?.trim() || "",
      signature: rejectSignature,
      teacherId,
    };
    try {
      const response = await fetch(
        "http://localhost/TestPHP-API2/backend/RejectDocument-GraduateOfficer.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      console.log(payload);
      const result = await response.json();
      if (result.status === "success") {
        alert("เอกสารถูกปฏิเสธเรียบร้อยแล้ว");
        fetchDocuments();
        setDocuments((prevDocuments) =>
          prevDocuments.filter((doc) => doc.id !== currentDoc.id)
        );
        setRejectFormData((prevRejectFormData) => ({
          ...prevRejectFormData,
          comment: "",
          advisorMain: "",
          advisorMainCriteria: "",
          advisorSecond: "",
          advisorSecondCriteria: "",
        }));
        setRejectSignature(null);
        setRejectModal(false);
      } else {
        alert("เกิดข้อผิดพลาด: " + result.message);
      }
    } catch (error) {
      console.error("Error rejecting document:", error);
      alert("เกิดข้อผิดพลาดในการปฏิเสธเอกสาร");
    }
  };

  const handleApprove = (doc) => {
    setCurrentDoc(doc);
    setApprovalModal(true);
    console.log("Approve document", doc);
  };

  const handleSubmitApproval = async () => {
    if (!currentDoc || !formData.name || !formData.comment || !signature) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    const teacherId = localStorage.getItem("teacherId");

    const payload = {
      id: currentDoc.id,
      type: currentDoc.docName,
      action: "approve",
      name: formData.name?.trim() || "", // Safeguard for undefined
      comment: formData.comment?.trim() || "",
      advisorMain: formData.advisorMain?.trim() || "",
      advisorMainCriteria: formData.advisorMainCriteria?.trim() || "",
      advisorSecond: formData.advisorSecond?.trim() || "",
      advisorSecondCriteria: formData.advisorSecondCriteria?.trim() || "",
      projectApprovalDate: formData.projectApprovalDate?.trim() || "",
      gs13projectApprovalDocument:
        formData.gs13projectApprovalDocument?.trim() || null,
      gs16OfficeThesisCertificateDoc:
        formData.gs16OfficeThesisCertificateDoc?.trim() || null,
      gs16OfficeGraduationApprovalReport:
        formData.gs16OfficeGraduationApprovalReport?.trim() || null,
      gs17OfficeMasterPlanOneApprovalDoc:
        formData.gs17OfficeMasterPlanOneApprovalDoc?.trim() || null,
      gs19OfficeMasterPlanTwoApprovalDoc:
        formData.gs19OfficeMasterPlanTwoApprovalDoc?.trim() || null,
      gs23OfficeThesisDocDate: formData.gs23OfficeThesisDocDate?.trim() || "",
      gs23OfficeCumulativeGPAStudent:
        formData.gs23OfficeCumulativeGPAStudent?.trim() || "",
      gs23OfficeKnowledgeExamPass:
        formData.gs23OfficeKnowledgeExamPass?.trim() || "",

      signature: signature,
      teacherId: teacherId,
    };
    console.log(payload);

    try {
      const response = await fetch(
        "http://localhost/TestPHP-API2/backend/ApproveDocument-GraduateOfficer.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const text = await response.text();

      try {
        const result = JSON.parse(text);
        if (result.status === "success") {
          alert("เอกสารได้รับการอนุมัติเรียบร้อยแล้ว");
          // รีเฟรชข้อมูลหลังจากอนุมัติสำเร็จ
          fetchDocuments();
          setFormData((prevFormData) => ({
            ...prevFormData,
            comment: "",
            advisorMain: "",
            advisorMainCriteria: "",
            advisorSecond: "",
            advisorSecondCriteria: "",
            projectApprovalDate: "",
            gs13projectApprovalDocument: null,
            gs16OfficeThesisCertificateDoc: null,
            gs16OfficeGraduationApprovalReport: null,
            gs17OfficeMasterPlanOneApprovalDoc: null,
            gs19OfficeMasterPlanTwoApprovalDoc: null,
            gs23OfficeThesisDocDate: "",
            gs23OfficeCumulativeGPAStudent: "",
            gs23OfficeKnowledgeExamPass: "",
          }));
          setApprovalModal(false);
          setSignature(null);
        } else {
          alert("เกิดข้อผิดพลาด: " + result.message);
        }
      } catch (jsonError) {
        console.error("Error parsing JSON:", jsonError);
        alert("ไม่สามารถอ่านข้อมูลจากเซิร์ฟเวอร์ได้");
      }
    } catch (error) {
      console.error("Error approving document:", error);
      alert("เกิดข้อผิดพลาดในการอนุมัติเอกสาร");
    }
  };

  const handleViewDocument = async (docId, docName) => {
    console.log("Request Body:", { id: docId, name: docName });
    if (!docId || !docName) {
      alert("ข้อมูลเอกสารไม่สมบูรณ์");
      return;
    }
    try {
      const response = await axios.post(
        "http://localhost/TestPHP-API2/backend/ViewDocument.php",
        { id: docId, name: docName }, // ส่งข้อมูลใน body
        {
          headers: {
            "Content-Type": "application/json", // ตั้งค่า Content-Type เป็น application/json
          },
        }
      );
      if (
        response.data &&
        response.data.reports &&
        response.data.reports.length > 0
      ) {
        const doc = response.data.reports[0]; // Accessing the first report
        console.log("Response Data:", response.data);
        setCurrentDoc(doc);
        setShowModal(true);
      } else {
        alert("ไม่พบข้อมูลเอกสาร");
      }
    } catch (error) {
      console.error("Error fetching document:", error);
      alert("เกิดข้อผิดพลาดในการดึงข้อมูลเอกสาร");
    }
  };
  const handleDownloadPDF = async (docId, docName) => {
    console.log("Request Body:", { id: docId, name: docName });
    let endpoint = "";
    if (
      docName ===
      "คคอ. บว. 10 แบบขออนุมัติแต่งตั้งอาจารย์ที่ปรึกษาวิทยานิพนธ์/การศึกษาค้นคว้าอิสระ"
    ) {
      endpoint = "Gs10report.php";
    } else if (
      docName === "คคอ. บว. 11 แบบขอเสนอโครงการวิทยานิพนธ์/การศึกษาค้นคว้าอิสระ"
    ) {
      endpoint = "Gs11report.php";
    } else if (
      docName === "คคอ. บว. 12 แบบขอสอบหัวข้อวิทยานิพนธ์/การศึกษาค้นคว้าอิสระ"
    ) {
      endpoint = "Gs12report.php";
    } else if (
      docName ===
      "คคอ. บว. 13 แบบขอส่งโครงการวิทยานิพนธ์/การศึกษาค้นคว้าอิสระ ฉบับแก้ไข"
    ) {
      endpoint = "Gs13report.php";
    } else if (
      docName ===
      "คคอ. บว. 14 แบบขอสอบความก้าวหน้าวิทยานิพนธ์/การศึกษาค้นคว้าอิสระ"
    ) {
      endpoint = "Gs14report.php";
    } else if (
      docName ===
      "คคอ. บว. 15 คำร้องขอสอบป้องกันวิทยานิพนธ์/การศึกษาค้นคว้าอิสระ"
    ) {
      endpoint = "Gs15report.php";
    } else if (docName === "คคอ. บว. 16 แบบขอส่งเล่มวิทยานิพนธ์ฉบับสมบูรณ์") {
      endpoint = "Gs16report.php";
    } else if (
      docName ===
      "คคอ. บว. 17 แบบขออนุมัติผลการสำเร็จการศึกษา นักศึกษาระดับปริญญาโท แผน 1 แบบวิชาการ"
    ) {
      endpoint = "Gs17report.php";
    } else if (docName === "คคอ. บว. 18 แบบขอสอบประมวลความรู้") {
      endpoint = "Gs18report.php";
    } else if (
      docName ===
      "คคอ. บว. 19 แบบขออนุมัติผลการสำเร็จการศึกษา นักศึกษาระดับปริญญาโท แผน 2 แบบวิชาชีพ"
    ) {
      endpoint = "Gs19report.php";
    } else if (
      docName === "คคอ. บว. 23 แบบขอส่งเล่มการศึกษาค้นคว้าอิสระฉบับสมบูรณ์"
    ) {
      endpoint = "Gs23report.php";
    } else {
      alert("ไม่พบประเภทเอกสารที่รองรับ");
      return;
    }
    // URL ของ Backend
    const url = `http://localhost/TestPHP-API2/backend/FPDF/${endpoint}?id=${docId}`;

    try {
      // ตรวจสอบว่า Endpoint ใช้งานได้
      const response = await fetch(url, { method: "HEAD" });
      if (!response.ok) {
        throw new Error("ไม่สามารถดาวน์โหลดเอกสารได้");
      }

      // เริ่มการดาวน์โหลด
      window.open(url, "_blank");
    } catch (error) {
      alert(error.message);
    }
  };
  const handleDownload = (docId, docName, fileKey) => {
    // console.log("Document Name:", docName);
    // console.log("Document ID:", docId);
    // console.log("File Key:", fileKey);
    let filePath = "";
    if (
      docName ===
      "คคอ. บว. 10 แบบขออนุมัติแต่งตั้งอาจารย์ที่ปรึกษาวิทยานิพนธ์/การศึกษาค้นคว้าอิสระ"
    ) {
      filePath = currentDoc.gs10document;
    } else if (
      docName === "คคอ. บว. 11 แบบขอเสนอโครงการวิทยานิพนธ์/การศึกษาค้นคว้าอิสระ"
    ) {
      if (fileKey === "gs11docGs10rp") {
        filePath = currentDoc.gs11docGs10rp;
      } else if (fileKey === "gs11docProjectdetails") {
        filePath = currentDoc.gs11docProjectdetails;
      } else {
        alert("ไม่พบประเภทเอกสารที่รองรับ");
        return;
      }
    } else if (
      docName === "คคอ. บว. 12 แบบขอสอบหัวข้อวิทยานิพนธ์/การศึกษาค้นคว้าอิสระ"
    ) {
      filePath = currentDoc.gs12docProjectDetails;
    } else if (
      docName ===
      "คคอ. บว. 13 แบบขอส่งโครงการวิทยานิพนธ์/การศึกษาค้นคว้าอิสระ ฉบับแก้ไข"
    ) {
      if (fileKey === "docProjectdetailsGs21rp") {
        filePath = currentDoc.docProjectdetailsGs21rp;
      } else if (fileKey === "gs13officeProjectApprovalDocument") {
        filePath = currentDoc.gs13officeProjectApprovalDocument;
      } else {
        alert("ไม่พบประเภทเอกสารที่รองรับ");
        return;
      }
    } else if (
      docName ===
      "คคอ. บว. 14 แบบขอสอบความก้าวหน้าวิทยานิพนธ์/การศึกษาค้นคว้าอิสระ"
    ) {
      filePath = currentDoc.gs22rpGs14report;
    } else if (
      docName ===
      "คคอ. บว. 15 คำร้องขอสอบป้องกันวิทยานิพนธ์/การศึกษาค้นคว้าอิสระ"
    ) {
      if (fileKey === "gs15docGs40rpGs41rp") {
        filePath = currentDoc.gs15docGs40rpGs41rp;
      } else if (fileKey === "gs15docGs50rp") {
        filePath = currentDoc.gs15docGs50rp;
      } else if (fileKey === "gs15docThesisExamCopy") {
        filePath = currentDoc.gs15docThesisExamCopy;
      } else {
        alert("ไม่พบประเภทเอกสารที่รองรับ");
        return;
      }
    } else if (docName === "คคอ. บว. 16 แบบขอส่งเล่มวิทยานิพนธ์ฉบับสมบูรณ์") {
      if (fileKey === "gf16officeThesisCertificateDoc") {
        filePath = currentDoc.gf16officeThesisCertificateDoc;
      } else if (fileKey === "gf16officeGraduationApprovalReport") {
        filePath = currentDoc.gf16officeGraduationApprovalReport;
      } else if (fileKey === "gs16ThesisDoc") {
        filePath = currentDoc.gs16ThesisDoc;
      } else if (fileKey === "gs16ThesisPDF") {
        filePath = currentDoc.gs16ThesisPDF;
      } else {
        alert("ไม่พบประเภทเอกสารที่รองรับ");
        return;
      }
    } else if (
      docName ===
      "คคอ. บว. 17 แบบขออนุมัติผลการสำเร็จการศึกษา นักศึกษาระดับปริญญาโท แผน 1 แบบวิชาการ"
    ) {
      filePath = currentDoc.gf17officeMasterPlanOneApprovalDoc;
    } else if (docName === "คคอ. บว. 18 แบบขอสอบประมวลความรู้") {
      filePath = currentDoc.gs18DocGs41rp;
    } else if (
      docName ===
      "คคอ. บว. 19 แบบขออนุมัติผลการสำเร็จการศึกษา นักศึกษาระดับปริญญาโท แผน 2 แบบวิชาชีพ"
    ) {
      filePath = currentDoc.gf19officeMasterPlanTwoApprovalDoc;
    } else if (
      docName === "คคอ. บว. 23 แบบขอส่งเล่มการศึกษาค้นคว้าอิสระฉบับสมบูรณ์"
    ) {
      if (fileKey === "gs23IndependentStudyDoc") {
        filePath = currentDoc.gs23IndependentStudyDoc;
      } else if (fileKey === "gs23IndependentStudyPDF") {
        filePath = currentDoc.gs23IndependentStudyPDF;
      } else {
        alert("ไม่พบประเภทเอกสารที่รองรับ");
        return;
      }
    } else {
      alert("ไม่พบประเภทเอกสารที่รองรับ");
      return;
    }
    if (filePath) {
      window.location.href = `http://localhost/TestPHP-API2/backend/downloadFileDocument.php?id=${docId}&filePath=${filePath}`;
      // const downloadUrl = `http://localhost/TestPHP-API2/backend/downloadFileDocument.php?id=${docId}&filePath=${filePath}`;
      // console.log("Download URL:", downloadUrl);
      // window.location.href = downloadUrl;
    } else {
      alert("Invalid file path.");
    }
  };
  // คำนวณเอกสารที่จะแสดงในแต่ละหน้า
  const indexOfLastDocument = currentPage * documentsPerPage;
  const indexOfFirstDocument = indexOfLastDocument - documentsPerPage;
  const currentDocuments = documents.slice(
    indexOfFirstDocument,
    indexOfLastDocument
  );

  // ฟังก์ชันไปหน้าถัดไป
  const nextPage = () => {
    if (currentPage < Math.ceil(documents.length / documentsPerPage)) {
      setCurrentPage(currentPage + 1);
    }
  };

  // ฟังก์ชันไปหน้าก่อนหน้า
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  const totalPages = Math.ceil(documents.length / documentsPerPage);
  return (
    <>
      <NavbarGraduateOfficer />
      <div className="container mt-4">
        <h2 className="text-center mb-4">อนุมัติเอกสารคำร้อง</h2>

        {isLoading ? (
          <div className="text-center mt-4">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">กำลังโหลด...</span>
            </Spinner>
            <p>กำลังโหลดข้อมูล...</p>
          </div>
        ) : error ? (
          <div className="text-center mt-4">
            <p style={{ color: "black" }}>{error}</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center mt-4">
            <p>ไม่พบข้อมูล</p>
          </div>
        ) : (
          <Row xs={1} md={1} lg={2} className="g-4 custom-card-row">
            {currentDocuments.map((doc) => (
              <Col key={doc.id}>
                <Card className="shadow-lg border-0 custom-card">
                  <Card.Header
                    className="text-white"
                    style={{ backgroundColor: "#7d3c98" }}
                  >
                    <strong>รหัสเอกสาร: {doc.id}</strong>
                  </Card.Header>
                  <Card.Body>
                    <Card.Title className="text-primary">
                      <strong>ชื่อเอกสาร: {doc.docName}</strong>
                    </Card.Title>
                    <Card.Text>
                      <strong>รหัสนักศึกษา:</strong> {doc.idStudent}
                      <br />
                      <strong>ชื่อ:</strong> {doc.nameStudent}
                      <br />
                      <strong>วันเวลาที่ส่ง:</strong> {doc.timeSubmit}
                      <br />
                      <strong>สถานะ:</strong>{" "}
                      <Badge
                        bg={
                          doc.message ===
                          "ได้รับการอนุมัติจากเจ้าหน้าที่บัณฑิตศึกษาแล้ว"
                            ? "success text-white"
                            : doc.message ===
                              "รอการพิจารณาจากเจ้าหน้าที่บัณฑิตศึกษา"
                            ? "warning"
                            : doc.message ===
                              "ถูกปฏิเสธจากเจ้าหน้าที่บัณฑิตศึกษาแล้ว"
                            ? "danger text-white"
                            : "warning"
                        }
                        text="dark"
                        className="text-dark"
                      >
                        {doc.message || "รอการพิจารณาจากเจ้าหน้าที่บัณฑิตศึกษา"}
                      </Badge>
                    </Card.Text>
                    <div className="me-auto">
                      <Button
                        size="sm"
                        variant="primary"
                        className="me-2"
                        onClick={() => handleViewDocument(doc.id, doc.docName)}
                      >
                        ดูเอกสาร
                      </Button>
                      <Button
                        size="sm"
                        variant="success"
                        className="me-2"
                        onClick={() => handleApprove(doc)}
                        disabled={
                          doc.message ===
                            "ได้รับการอนุมัติจากเจ้าหน้าที่บัณฑิตศึกษาแล้ว" ||
                          doc.message ===
                            "ถูกปฏิเสธจากเจ้าหน้าที่บัณฑิตศึกษาแล้ว"
                        }
                      >
                        อนุมัติ
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleReject(doc)}
                        disabled={
                          doc.message ===
                            "ได้รับการอนุมัติจากเจ้าหน้าที่บัณฑิตศึกษาแล้ว" ||
                          doc.message ===
                            "ถูกปฏิเสธจากเจ้าหน้าที่บัณฑิตศึกษาแล้ว"
                        }
                      >
                        ปฏิเสธ
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}
        <div
          style={{ padding: 30 }}
          className="d-flex justify-content-center mt-4"
        >
          <ButtonGroup className="align-items-center">
            {/* ปุ่มก่อนหน้า */}
            <Button
              variant="outline-primary"
              onClick={prevPage}
              disabled={currentPage === 1}
              className="px-4 py-2 d-flex align-items-center"
            >
              <FaChevronLeft className="me-2" />
              ก่อนหน้า
            </Button>

            {/* ข้อความแสดงหน้า */}
            <span className="mx-3">
              {`หน้า ${currentPage} จาก ${totalPages}`}
            </span>

            {/* ปุ่มถัดไป */}
            <Button
              variant="outline-primary"
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className="px-4 py-2 d-flex align-items-center"
            >
              ถัดไป
              <FaChevronRight className="ms-2" />
            </Button>
          </ButtonGroup>
        </div>
        {currentDoc && rejectModal && (
          <>
            {currentDoc.docName ===
            "คคอ. บว. 10 แบบขออนุมัติแต่งตั้งอาจารย์ที่ปรึกษาวิทยานิพนธ์/การศึกษาค้นคว้าอิสระ" ? (
              <Modal show={rejectModal} onHide={handleCloseModal} centered>
                <Modal.Header closeButton>
                  <Modal.Title>ปฏิเสธเอกสาร: {currentDoc.docName}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <Form>
                    <Form.Group className="mb-3" controlId="formRejectName">
                      <Form.Label>ลงชื่อ-นามสกุล</Form.Label>
                      <Form.Control
                        type="text"
                        value={rejectFormData.name || ""}
                        onChange={(e) =>
                          setRejectFormData({
                            ...rejectFormData,
                            name: e.target.value,
                          })
                        }
                        disabled
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        จำนวนภาระงานรวมของอาจารย์ที่ปรึกษาหลัก
                      </Form.Label>
                      <Form.Control
                        type="text"
                        value={rejectFormData.advisorMain || ""}
                        onChange={(e) =>
                          setRejectFormData({
                            ...rejectFormData,
                            advisorMain: e.target.value,
                          })
                        }
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>คุณสมบัติของอาจารย์ที่ปรึกษาหลัก</Form.Label>
                      <Form.Select
                        value={rejectFormData.advisorMainCriteria || ""}
                        onChange={(e) =>
                          setRejectFormData({
                            ...rejectFormData,
                            advisorMainCriteria: e.target.value,
                          })
                        }
                      >
                        <option value="">
                          เลือกคุณสมบัติของอาจารย์ที่ปรึกษาหลัก
                        </option>
                        <option value="ตรงตามเกณฑ์">ตรงตามเกณฑ์</option>
                        <option value="ไม่ตรงตามเกณฑ์">ไม่ตรงตามเกณฑ์</option>
                      </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        จำนวนภาระงานรวมของอาจารย์ที่ปรึกษาร่วม
                      </Form.Label>
                      <Form.Control
                        type="text"
                        value={rejectFormData.advisorSecond || ""}
                        onChange={(e) =>
                          setRejectFormData({
                            ...rejectFormData,
                            advisorSecond: e.target.value,
                          })
                        }
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>คุณสมบัติของอาจารย์ที่ปรึกษาร่วม</Form.Label>
                      <Form.Select
                        value={rejectFormData.advisorSecondCriteria || ""}
                        onChange={(e) =>
                          setRejectFormData({
                            ...rejectFormData,
                            advisorSecondCriteria: e.target.value,
                          })
                        }
                      >
                        <option value="">
                          เลือกคุณสมบัติของอาจารย์ที่ปรึกษาร่วม
                        </option>
                        <option value="ตรงตามเกณฑ์">ตรงตามเกณฑ์</option>
                        <option value="ไม่ตรงตามเกณฑ์">ไม่ตรงตามเกณฑ์</option>
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>ความคิดเห็นเพิ่มเติม</Form.Label>
                      <Form.Control
                        as="textarea"
                        name="comment"
                        value={rejectFormData.comment || ""}
                        onChange={(e) =>
                          setRejectFormData({
                            ...rejectFormData,
                            comment: e.target.value,
                          })
                        }
                        rows={3}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>ลงลายมือชื่อ</Form.Label>
                      <SignatureCanvas
                        ref={sigCanvas}
                        onEnd={handleRejectSignatureEnd} // เรียกเมื่อผู้ใช้เซ็นเสร็จ
                        penColor="black"
                        canvasProps={{
                          width: 455,
                          height: 150,
                          className: "signature-canvas",
                        }}
                      />
                    </Form.Group>
                    <div className="d-flex justify-content-center">
                      <Button
                        variant="secondary"
                        onClick={handleClearSignature}
                      >
                        ลบลายมือชื่อ
                      </Button>
                    </div>
                  </Form>
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="secondary" onClick={handleCloseModal}>
                    ปิด
                  </Button>
                  <Button
                    variant="danger"
                    disabled={
                      !rejectSignature ||
                      !rejectFormData.name ||
                      !rejectFormData.comment ||
                      !rejectFormData.advisorMain ||
                      !rejectFormData.advisorMainCriteria ||
                      !rejectFormData.advisorSecond ||
                      !rejectFormData.advisorSecondCriteria
                    }
                    onClick={handleSubmitReject}
                  >
                    ปฏิเสธ
                  </Button>
                </Modal.Footer>
              </Modal>
            ) : (
              <Modal show={rejectModal} onHide={handleCloseModal} centered>
                {" "}
                <Modal.Header closeButton>
                  <Modal.Title>ปฏิเสธเอกสาร: {currentDoc.docName}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <Form>
                    <Form.Group className="mb-3" controlId="formRejectName">
                      <Form.Label>ลงชื่อ-นามสกุล</Form.Label>
                      <Form.Control
                        type="text"
                        value={rejectFormData.name || ""}
                        onChange={(e) =>
                          setRejectFormData({
                            ...rejectFormData,
                            name: e.target.value,
                          })
                        }
                        disabled
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>ความคิดเห็นเพิ่มเติม</Form.Label>
                      <Form.Control
                        as="textarea"
                        name="comment"
                        value={rejectFormData.comment || ""}
                        onChange={(e) =>
                          setRejectFormData({
                            ...rejectFormData,
                            comment: e.target.value,
                          })
                        }
                        rows={3}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>ลงลายมือชื่อ</Form.Label>
                      <SignatureCanvas
                        ref={sigCanvas}
                        onEnd={handleRejectSignatureEnd} // เรียกเมื่อผู้ใช้เซ็นเสร็จ
                        penColor="black"
                        canvasProps={{
                          width: 455,
                          height: 150,
                          className: "signature-canvas",
                        }}
                      />
                    </Form.Group>
                    <div className="d-flex justify-content-center">
                      <Button
                        variant="secondary"
                        onClick={handleClearSignature}
                      >
                        ลบลายมือชื่อ
                      </Button>
                    </div>
                  </Form>
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="secondary" onClick={handleCloseModal}>
                    ปิด
                  </Button>
                  <Button
                    variant="danger"
                    disabled={
                      !rejectSignature ||
                      !rejectFormData.name ||
                      !rejectFormData.comment
                    }
                    onClick={handleSubmitReject}
                  >
                    ปฏิเสธ
                  </Button>
                </Modal.Footer>
              </Modal>
            )}
          </>
        )}
        {currentDoc && (
          <>
            {currentDoc.docName ===
            "คคอ. บว. 10 แบบขออนุมัติแต่งตั้งอาจารย์ที่ปรึกษาวิทยานิพนธ์/การศึกษาค้นคว้าอิสระ" ? (
              // Modal สำหรับเอกสาร คคอ. บว. 10
              <Modal show={approvalModal} onHide={handleCloseModal} centered>
                <Modal.Header closeButton>
                  <Modal.Title>อนุมัติเอกสาร: {currentDoc.docName}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <Form>
                    <Form.Group className="mb-3">
                      <Form.Label>ลงชื่อ-นามสกุล</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        disabled
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        จำนวนภาระงานรวมของอาจารย์ที่ปรึกษาหลัก
                      </Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.advisorMain || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            advisorMain: e.target.value,
                          })
                        }
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>คุณสมบัติของอาจารย์ที่ปรึกษาหลัก</Form.Label>
                      <Form.Select
                        value={formData.advisorMainCriteria || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            advisorMainCriteria: e.target.value,
                          })
                        }
                      >
                        <option value="">
                          เลือกคุณสมบัติของอาจารย์ที่ปรึกษาหลัก
                        </option>
                        <option value="ตรงตามเกณฑ์">ตรงตามเกณฑ์</option>
                        <option value="ไม่ตรงตามเกณฑ์">ไม่ตรงตามเกณฑ์</option>
                      </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        จำนวนภาระงานรวมของอาจารย์ที่ปรึกษาร่วม
                      </Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.advisorSecond || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            advisorSecond: e.target.value,
                          })
                        }
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>คุณสมบัติของอาจารย์ที่ปรึกษาร่วม</Form.Label>
                      <Form.Select
                        value={formData.advisorSecondCriteria || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            advisorSecondCriteria: e.target.value,
                          })
                        }
                      >
                        <option value="">
                          เลือกคุณสมบัติของอาจารย์ที่ปรึกษาร่วม
                        </option>
                        <option value="ตรงตามเกณฑ์">ตรงตามเกณฑ์</option>
                        <option value="ไม่ตรงตามเกณฑ์">ไม่ตรงตามเกณฑ์</option>
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>ความคิดเห็นเพิ่มเติม</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={formData.comment}
                        onChange={(e) =>
                          setFormData({ ...formData, comment: e.target.value })
                        }
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>ลายมือชื่อ</Form.Label>
                      <SignatureCanvas
                        ref={sigCanvas}
                        onEnd={handleSignatureEnd}
                        penColor="black"
                        canvasProps={{
                          width: 455,
                          height: 150,
                          className: "signature-canvas",
                        }}
                      />
                      <div className="d-flex justify-content-center">
                        <Button
                          variant="secondary"
                          className="mt-2"
                          onClick={handleClearSignature}
                        >
                          ลบลายเซ็น
                        </Button>
                      </div>
                    </Form.Group>
                  </Form>
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="secondary" onClick={handleCloseModal}>
                    ปิด
                  </Button>
                  <Button
                    variant="success"
                    onClick={handleSubmitApproval}
                    disabled={
                      !signature ||
                      !formData.name ||
                      !formData.comment ||
                      !formData.advisorMain ||
                      !formData.advisorMainCriteria ||
                      !formData.advisorSecond ||
                      !formData.advisorSecondCriteria
                    }
                  >
                    อนุมัติ
                  </Button>
                </Modal.Footer>
              </Modal>
            ) : currentDoc.docName ===
              "คคอ. บว. 12 แบบขอสอบหัวข้อวิทยานิพนธ์/การศึกษาค้นคว้าอิสระ" ? (
              <Modal show={approvalModal} onHide={handleCloseModal} centered>
                <Modal.Header closeButton>
                  <Modal.Title>อนุมัติเอกสาร: {currentDoc.docName}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <Form>
                    <Form.Group className="mb-3">
                      <Form.Label>ลงชื่อ-นามสกุล</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        disabled
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        นักศึกษาได้รับอนุมัติโครงการวิทยานิพนธ์/การศึกษาค้นคว้าอิสระ
                        <br />
                        เมื่อวันที่ / เดือน / ปี
                      </Form.Label>
                      <Form.Control
                        type="date"
                        value={formData.projectApprovalDate || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            projectApprovalDate: e.target.value,
                          })
                        }
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>ความคิดเห็นเพิ่มเติม</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={formData.comment}
                        onChange={(e) =>
                          setFormData({ ...formData, comment: e.target.value })
                        }
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>ลายมือชื่อ</Form.Label>
                      <SignatureCanvas
                        ref={sigCanvas}
                        onEnd={handleSignatureEnd}
                        penColor="black"
                        canvasProps={{
                          width: 455,
                          height: 150,
                          className: "signature-canvas",
                        }}
                      />
                      <div className="d-flex justify-content-center">
                        <Button
                          variant="secondary"
                          className="mt-2"
                          onClick={handleClearSignature}
                        >
                          ลบลายเซ็น
                        </Button>
                      </div>
                    </Form.Group>
                  </Form>
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="secondary" onClick={handleCloseModal}>
                    ปิด
                  </Button>
                  <Button
                    variant="success"
                    onClick={handleSubmitApproval}
                    disabled={
                      !signature ||
                      !formData.name ||
                      !formData.comment ||
                      !formData.projectApprovalDate
                    }
                  >
                    อนุมัติ
                  </Button>
                </Modal.Footer>
              </Modal>
            ) : currentDoc.docName ===
              "คคอ. บว. 13 แบบขอส่งโครงการวิทยานิพนธ์/การศึกษาค้นคว้าอิสระ ฉบับแก้ไข" ? (
              <Modal show={approvalModal} onHide={handleCloseModal} centered>
                <Modal.Header closeButton>
                  <Modal.Title>อนุมัติเอกสาร: {currentDoc.docName}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <Form>
                    <Form.Group className="mb-3">
                      <Form.Label>ลงชื่อ-นามสกุล</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        disabled
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        ได้ดำเนินการตรวจสอบเรียบร้อยแล้ว เห็นสมควรอนุมัติ
                        พร้อมได้แนบประกาศอนุมัติหัวและโครงการวิทยานิพนธ์/การศึกษาค้นคว้าอิสระ
                      </Form.Label>
                      <Form.Label>แนบเอกสารประกาศอนุมัติหัว</Form.Label>
                      <Form.Control
                        type="file"
                        name="gs13projectApprovalDocument"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];

                            // Create FormData
                            const uploadData = new FormData();
                            uploadData.append("file", file);

                            // Send the file to the server
                            axios
                              .post(
                                "http://localhost/TestPHP-API2/backend/uploadFileEdit.php",
                                uploadData
                              )
                              .then((response) => {
                                if (response.data.success) {
                                  // Update state with the uploaded file path
                                  setFormData((prevState) => ({
                                    ...prevState,
                                    gs13projectApprovalDocument:
                                      "uploads/" + file.name,
                                  }));
                                } else {
                                  console.error("การอัปโหลดไฟล์ล้มเหลว");
                                }
                              })
                              .catch((error) => {
                                console.error(
                                  "เกิดข้อผิดพลาดในการอัปโหลดไฟล์:",
                                  error
                                );
                              });
                          }
                        }}
                      />
                      {formData.gs13projectApprovalDocument && (
                        <small>
                          ไฟล์ที่เลือก: {formData.gs13projectApprovalDocument}{" "}
                          <br />
                        </small>
                      )}
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>ความคิดเห็นเพิ่มเติม</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={formData.comment}
                        onChange={(e) =>
                          setFormData({ ...formData, comment: e.target.value })
                        }
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>ลายมือชื่อ</Form.Label>
                      <SignatureCanvas
                        ref={sigCanvas}
                        onEnd={handleSignatureEnd}
                        penColor="black"
                        canvasProps={{
                          width: 455,
                          height: 150,
                          className: "signature-canvas",
                        }}
                      />
                      <div className="d-flex justify-content-center">
                        <Button
                          variant="secondary"
                          className="mt-2"
                          onClick={handleClearSignature}
                        >
                          ลบลายเซ็น
                        </Button>
                      </div>
                    </Form.Group>
                  </Form>
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="secondary" onClick={handleCloseModal}>
                    ปิด
                  </Button>
                  <Button
                    variant="success"
                    onClick={handleSubmitApproval}
                    disabled={
                      !signature ||
                      !formData.name ||
                      !formData.comment ||
                      !formData.gs13projectApprovalDocument
                    }
                  >
                    อนุมัติ
                  </Button>
                </Modal.Footer>
              </Modal>
            ) : currentDoc.docName ===
              "คคอ. บว. 16 แบบขอส่งเล่มวิทยานิพนธ์ฉบับสมบูรณ์" ? (
              <Modal show={approvalModal} onHide={handleCloseModal} centered>
                <Modal.Header closeButton>
                  <Modal.Title>อนุมัติเอกสาร: {currentDoc.docName}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <Form>
                    <Form.Group className="mb-3">
                      <Form.Label>ลงชื่อ-นามสกุล</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        disabled
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        ได้ตรวจสอบแล้วเห็นสมควรอนุมัติ พร้อมนี้ได้แนบเอกสาร
                      </Form.Label>
                      <Form.Label>ใบรับรองวิทยานิพนธ์</Form.Label>
                      <Form.Control
                        className="mb-2"
                        type="file"
                        name="gs16OfficeThesisCertificateDoc"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];

                            // Create FormData
                            const uploadData = new FormData();
                            uploadData.append("file", file);

                            // Send the file to the server
                            axios
                              .post(
                                "http://localhost/TestPHP-API2/backend/uploadFileEdit.php",
                                uploadData
                              )
                              .then((response) => {
                                if (response.data.success) {
                                  // Update state with the uploaded file path
                                  setFormData((prevState) => ({
                                    ...prevState,
                                    gs16OfficeThesisCertificateDoc:
                                      "uploads/" + file.name,
                                  }));
                                } else {
                                  console.error("การอัปโหลดไฟล์ล้มเหลว");
                                }
                              })
                              .catch((error) => {
                                console.error(
                                  "เกิดข้อผิดพลาดในการอัปโหลดไฟล์:",
                                  error
                                );
                              });
                          }
                        }}
                      />
                      {formData.gs16OfficeThesisCertificateDoc && (
                        <small>
                          ไฟล์ที่เลือก:{" "}
                          {formData.gs16OfficeThesisCertificateDoc} <br />
                        </small>
                      )}
                      <Form.Label>
                        แบบรายงานการอนุมัติผลการสำเร็จการศึกษา
                      </Form.Label>
                      <Form.Control
                        type="file"
                        name="gs16OfficeGraduationApprovalReport"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];

                            // Create FormData
                            const uploadData = new FormData();
                            uploadData.append("file", file);

                            // Send the file to the server
                            axios
                              .post(
                                "http://localhost/TestPHP-API2/backend/uploadFileEdit.php",
                                uploadData
                              )
                              .then((response) => {
                                if (response.data.success) {
                                  // Update state with the uploaded file path
                                  setFormData((prevState) => ({
                                    ...prevState,
                                    gs16OfficeGraduationApprovalReport:
                                      "uploads/" + file.name,
                                  }));
                                } else {
                                  console.error("การอัปโหลดไฟล์ล้มเหลว");
                                }
                              })
                              .catch((error) => {
                                console.error(
                                  "เกิดข้อผิดพลาดในการอัปโหลดไฟล์:",
                                  error
                                );
                              });
                          }
                        }}
                      />
                      {formData.gs16OfficeGraduationApprovalReport && (
                        <small>
                          ไฟล์ที่เลือก:{" "}
                          {formData.gs16OfficeGraduationApprovalReport} <br />
                        </small>
                      )}
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>ความคิดเห็นเพิ่มเติม</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={formData.comment}
                        onChange={(e) =>
                          setFormData({ ...formData, comment: e.target.value })
                        }
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>ลายมือชื่อ</Form.Label>
                      <SignatureCanvas
                        ref={sigCanvas}
                        onEnd={handleSignatureEnd}
                        penColor="black"
                        canvasProps={{
                          width: 455,
                          height: 150,
                          className: "signature-canvas",
                        }}
                      />
                      <div className="d-flex justify-content-center">
                        <Button
                          variant="secondary"
                          className="mt-2"
                          onClick={handleClearSignature}
                        >
                          ลบลายเซ็น
                        </Button>
                      </div>
                    </Form.Group>
                  </Form>
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="secondary" onClick={handleCloseModal}>
                    ปิด
                  </Button>
                  <Button
                    variant="success"
                    onClick={handleSubmitApproval}
                    disabled={
                      !signature ||
                      !formData.name ||
                      !formData.comment ||
                      !formData.gs16OfficeThesisCertificateDoc ||
                      !formData.gs16OfficeGraduationApprovalReport
                    }
                  >
                    อนุมัติ
                  </Button>
                </Modal.Footer>
              </Modal>
            ) : currentDoc.docName ===
              "คคอ. บว. 17 แบบขออนุมัติผลการสำเร็จการศึกษา นักศึกษาระดับปริญญาโท แผน 1 แบบวิชาการ" ? (
              <Modal show={approvalModal} onHide={handleCloseModal} centered>
                <Modal.Header closeButton>
                  <Modal.Title>อนุมัติเอกสาร: {currentDoc.docName}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <Form>
                    <Form.Group className="mb-3">
                      <Form.Label>ลงชื่อ-นามสกุล</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        disabled
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        ได้ตรวจสอบแล้วเห็นสมควรอนุมัติ
                        พร้อมนี้ได้แนบแบบรายงานการอนุมัติผลการสำเร็จการศึกษา
                        (สำหรับนักศึกษาระดับปริญญาโท แผน 1 แบบวิชาการ)
                      </Form.Label>
                      <Form.Label>
                        แบบรายงานการอนุมัติผลการสำเร็จการศึกษา
                      </Form.Label>
                      <Form.Control
                        className="mb-2"
                        type="file"
                        name="gs17OfficeMasterPlanOneApprovalDoc"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];

                            // Create FormData
                            const uploadData = new FormData();
                            uploadData.append("file", file);

                            // Send the file to the server
                            axios
                              .post(
                                "http://localhost/TestPHP-API2/backend/uploadFileEdit.php",
                                uploadData
                              )
                              .then((response) => {
                                if (response.data.success) {
                                  // Update state with the uploaded file path
                                  setFormData((prevState) => ({
                                    ...prevState,
                                    gs17OfficeMasterPlanOneApprovalDoc:
                                      "uploads/" + file.name,
                                  }));
                                } else {
                                  console.error("การอัปโหลดไฟล์ล้มเหลว");
                                }
                              })
                              .catch((error) => {
                                console.error(
                                  "เกิดข้อผิดพลาดในการอัปโหลดไฟล์:",
                                  error
                                );
                              });
                          }
                        }}
                      />
                      {formData.gs17OfficeMasterPlanOneApprovalDoc && (
                        <small>
                          ไฟล์ที่เลือก:{" "}
                          {formData.gs17OfficeMasterPlanOneApprovalDoc} <br />
                        </small>
                      )}
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>ความคิดเห็นเพิ่มเติม</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={formData.comment}
                        onChange={(e) =>
                          setFormData({ ...formData, comment: e.target.value })
                        }
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>ลายมือชื่อ</Form.Label>
                      <SignatureCanvas
                        ref={sigCanvas}
                        onEnd={handleSignatureEnd}
                        penColor="black"
                        canvasProps={{
                          width: 455,
                          height: 150,
                          className: "signature-canvas",
                        }}
                      />
                      <div className="d-flex justify-content-center">
                        <Button
                          variant="secondary"
                          className="mt-2"
                          onClick={handleClearSignature}
                        >
                          ลบลายเซ็น
                        </Button>
                      </div>
                    </Form.Group>
                  </Form>
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="secondary" onClick={handleCloseModal}>
                    ปิด
                  </Button>
                  <Button
                    variant="success"
                    onClick={handleSubmitApproval}
                    disabled={
                      !signature ||
                      !formData.name ||
                      !formData.comment ||
                      !formData.gs17OfficeMasterPlanOneApprovalDoc
                    }
                  >
                    อนุมัติ
                  </Button>
                </Modal.Footer>
              </Modal>
            ) : currentDoc.docName ===
              "คคอ. บว. 19 แบบขออนุมัติผลการสำเร็จการศึกษา นักศึกษาระดับปริญญาโท แผน 2 แบบวิชาชีพ" ? (
              <Modal show={approvalModal} onHide={handleCloseModal} centered>
                <Modal.Header closeButton>
                  <Modal.Title>อนุมัติเอกสาร: {currentDoc.docName}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <Form>
                    <Form.Group className="mb-3">
                      <Form.Label>ลงชื่อ-นามสกุล</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        disabled
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        ได้ตรวจสอบแล้วเห็นสมควรอนุมัติ
                        พร้อมนี้ได้แนบแบบรายงานการอนุมัติผลการสำเร็จการศึกษา
                        (สำหรับนักศึกษาระดับปริญญาโท แผน 2 แบบวิชาชีพ)
                      </Form.Label>
                      <Form.Label>
                        แบบรายงานการอนุมัติผลการสำเร็จการศึกษา
                      </Form.Label>
                      <Form.Control
                        className="mb-2"
                        type="file"
                        name="gs19OfficeMasterPlanTwoApprovalDoc"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];

                            // Create FormData
                            const uploadData = new FormData();
                            uploadData.append("file", file);

                            // Send the file to the server
                            axios
                              .post(
                                "http://localhost/TestPHP-API2/backend/uploadFileEdit.php",
                                uploadData
                              )
                              .then((response) => {
                                if (response.data.success) {
                                  // Update state with the uploaded file path
                                  setFormData((prevState) => ({
                                    ...prevState,
                                    gs19OfficeMasterPlanTwoApprovalDoc:
                                      "uploads/" + file.name,
                                  }));
                                } else {
                                  console.error("การอัปโหลดไฟล์ล้มเหลว");
                                }
                              })
                              .catch((error) => {
                                console.error(
                                  "เกิดข้อผิดพลาดในการอัปโหลดไฟล์:",
                                  error
                                );
                              });
                          }
                        }}
                      />
                      {formData.gs19OfficeMasterPlanTwoApprovalDoc && (
                        <small>
                          ไฟล์ที่เลือก:{" "}
                          {formData.gs19OfficeMasterPlanTwoApprovalDoc} <br />
                        </small>
                      )}
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>ความคิดเห็นเพิ่มเติม</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={formData.comment}
                        onChange={(e) =>
                          setFormData({ ...formData, comment: e.target.value })
                        }
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>ลายมือชื่อ</Form.Label>
                      <SignatureCanvas
                        ref={sigCanvas}
                        onEnd={handleSignatureEnd}
                        penColor="black"
                        canvasProps={{
                          width: 455,
                          height: 150,
                          className: "signature-canvas",
                        }}
                      />
                      <div className="d-flex justify-content-center">
                        <Button
                          variant="secondary"
                          className="mt-2"
                          onClick={handleClearSignature}
                        >
                          ลบลายเซ็น
                        </Button>
                      </div>
                    </Form.Group>
                  </Form>
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="secondary" onClick={handleCloseModal}>
                    ปิด
                  </Button>
                  <Button
                    variant="success"
                    onClick={handleSubmitApproval}
                    disabled={
                      !signature ||
                      !formData.name ||
                      !formData.comment ||
                      !formData.gs19OfficeMasterPlanTwoApprovalDoc
                    }
                  >
                    อนุมัติ
                  </Button>
                </Modal.Footer>
              </Modal>
            ) : currentDoc.docName ===
              "คคอ. บว. 23 แบบขอส่งเล่มการศึกษาค้นคว้าอิสระฉบับสมบูรณ์" ? (
              <Modal show={approvalModal} onHide={handleCloseModal} centered>
                <Modal.Header closeButton>
                  <Modal.Title>อนุมัติเอกสาร: {currentDoc.docName}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <Form>
                    <Form.Group className="mb-3">
                      <Form.Label>ลงชื่อ-นามสกุล</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        disabled
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        ได้รับเล่มการศึกษาค้นคว้าอิสระฉบับสมบูรณ์ พร้อม Flash
                        drive (file .doc และ .pdf) จำนวน 1 อัน
                      </Form.Label>
                      <InputGroup>
                        <InputGroup.Text>ในวันที่ เดือน ปี</InputGroup.Text>
                        <Form.Control
                          type="date"
                          value={formData.gs23OfficeThesisDocDate || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              gs23OfficeThesisDocDate: e.target.value,
                            })
                          }
                        />
                      </InputGroup>

                      <Form.Label className="mt-3">
                        นักศึกษา ระดับปริญญาโท
                        ได้ศึกษารายวิชาครบตามที่กำหนดในหลักสูตร
                      </Form.Label>
                      <InputGroup>
                        <InputGroup.Text>มีคะแนนเฉลี่ยสะสม</InputGroup.Text>
                        <Form.Control
                          type="text"
                          value={formData.gs23OfficeCumulativeGPAStudent || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              gs23OfficeCumulativeGPAStudent: e.target.value,
                            })
                          }
                        />
                      </InputGroup>
                      <Form.Check
                        className="mt-3"
                        label="นักศึกษาสอบผ่านการสอบประมวลความรู้แล้ว"
                        checked={
                          formData.gs23OfficeKnowledgeExamPass === "1" || ""
                        }
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            gs23OfficeKnowledgeExamPass: e.target.checked
                              ? "1"
                              : "0",
                          })
                        }
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>ความคิดเห็นเพิ่มเติม</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={formData.comment}
                        onChange={(e) =>
                          setFormData({ ...formData, comment: e.target.value })
                        }
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>ลายมือชื่อ</Form.Label>
                      <SignatureCanvas
                        ref={sigCanvas}
                        onEnd={handleSignatureEnd}
                        penColor="black"
                        canvasProps={{
                          width: 455,
                          height: 150,
                          className: "signature-canvas",
                        }}
                      />
                      <div className="d-flex justify-content-center">
                        <Button
                          variant="secondary"
                          className="mt-2"
                          onClick={handleClearSignature}
                        >
                          ลบลายเซ็น
                        </Button>
                      </div>
                    </Form.Group>
                  </Form>
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="secondary" onClick={handleCloseModal}>
                    ปิด
                  </Button>
                  <Button
                    variant="success"
                    onClick={handleSubmitApproval}
                    disabled={
                      !signature ||
                      !formData.name ||
                      !formData.comment ||
                      !formData.gs23OfficeThesisDocDate ||
                      !formData.gs23OfficeCumulativeGPAStudent ||
                      !formData.gs23OfficeKnowledgeExamPass
                    }
                  >
                    อนุมัติ
                  </Button>
                </Modal.Footer>
              </Modal>
            ) : (
              // Modal ทั่วไปสำหรับเอกสารอื่น
              <Modal show={approvalModal} onHide={handleCloseModal} centered>
                <Modal.Header closeButton>
                  <Modal.Title>อนุมัติเอกสาร: {currentDoc.docName}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <Form>
                    <Form.Group className="mb-3">
                      <Form.Label>ลงชื่อ-นามสกุล</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        disabled
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>ความคิดเห็นเพิ่มเติม</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={formData.comment}
                        onChange={(e) =>
                          setFormData({ ...formData, comment: e.target.value })
                        }
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>ลายมือชื่อ</Form.Label>
                      <SignatureCanvas
                        ref={sigCanvas}
                        onEnd={handleSignatureEnd}
                        penColor="black"
                        canvasProps={{
                          width: 455,
                          height: 150,
                          className: "signature-canvas",
                        }}
                      />
                      <div className="d-flex justify-content-center">
                        <Button
                          variant="secondary"
                          className="mt-2"
                          onClick={handleClearSignature}
                        >
                          ลบลายเซ็น
                        </Button>
                      </div>
                    </Form.Group>
                  </Form>
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="secondary" onClick={handleCloseModal}>
                    ปิด
                  </Button>
                  <Button
                    variant="success"
                    onClick={handleSubmitApproval}
                    disabled={!signature || !formData.name || !formData.comment}
                  >
                    อนุมัติ
                  </Button>
                </Modal.Footer>
              </Modal>
            )}
          </>
        )}

        <DocumentDetailsModal
          show={showModal}
          handleClose={handleCloseDocModal}
          currentDoc={currentDoc}
          handleDownload={handleDownload}
          handleDownloadPDF={handleDownloadPDF}
        />
      </div>
    </>
  );
}

export default GraduateOfficerPage;
