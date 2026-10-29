import os
import shutil
import uuid
from datetime import datetime
from typing import List, Dict, Any
from database import insert_document, insert_chunks, get_document
from document_parser import parse_document
from similarity import generate_embeddings_for_chunks

SAMPLE_DOCS_CONTENT = {
    "diabetes_and_machine_learning.txt": """DIABETES RISK PREDICTION THROUGH MACHINE LEARNING ALGORITHMS
Authored by Clinical Informatics Research Group

Paragraph 1: Background and Clinical Significance
Type 2 diabetes mellitus is a chronic metabolic disorder characterized by persistent hyperglycemia and insulin resistance. Early detection remains a critical priority in public health, as lifestyle modifications and pharmaceutical interventions can prevent microvascular and macrovascular complications. Traditional risk assessment models rely heavily on static scoring sheets that often miss subtle combinatorial patterns across routine laboratory metrics and patient demographic parameters.

Paragraph 2: Machine Learning Architectures for Early Screening
Artificial intelligence and supervised machine learning classifiers have demonstrated substantial efficacy in predicting diabetes onset. Ensemble algorithms, particularly Gradient Boosted Decision Trees, Random Forests, and Extreme Gradient Boosting (XGBoost), outperform standard multivariable logistic regression. Feature attribution techniques such as SHAP (SHapley Additive exPlanations) identify key physiological predictors, notably fasting plasma glucose, glycated hemoglobin (HbA1c), body mass index (BMI), triglyceride levels, and familial history. AI models trained on longitudinal electronic health records can evaluate trajectory changes over five-year observation windows, enabling clinicians to identify people at high risk of developing prediabetes or overt diabetes before irreversible metabolic decline occurs.

Paragraph 3: Model Evaluation and Practical Deployment
When evaluating predictive models across demographic cohorts, metrics such as the Area Under the Receiver Operating Characteristic Curve (AUROC), sensitivity, and positive predictive value must be rigorously assessed. Algorithmic bias mitigation is mandatory to ensure equitable screening across diverse ethnic populations who may manifest insulin resistance at disparate BMI thresholds. Clinical decision support systems integrated into hospital portals can prompt general practitioners during routine checkups, recommending targeted oral glucose tolerance testing when the predicted risk crosses calibrated confidence boundaries.
""",

    "hospital_readmission_prevention.txt": """PREVENTING HOSPITAL READMISSIONS THROUGH TRANSITIONAL CARE AND PATIENT FOLLOW-UP
Department of Health Systems and Quality Management

Paragraph 1: The Burden of Unplanned Readmissions
Thirty-day unplanned hospital readmissions represent a major strain on healthcare expenditure and serve as a prominent benchmark for inpatient quality. Patients transitioning from acute hospital care to ambulatory environments frequently encounter fragmented communication, medication reconciliation errors, and unclear discharge instructions. Chronic conditions such as congestive heart failure, chronic obstructive pulmonary disease (COPD), and acute myocardial infarction exhibit the highest rates of post-discharge clinical deterioration.

Paragraph 2: Multidisciplinary Follow-Up Strategies
Hospitals can significantly improve patient follow-up after discharge through structured transitional care protocols. Crucial interventions include telephone contact within 48 to 72 hours by specialized nurse navigators, rapid primary care follow-up consultations within 7 to 10 days, and comprehensive pharmacist-led medication therapy management. Furthermore, deploying remote patient monitoring tools, such as cellular-connected blood pressure cuffs and daily digital symptom checklists, allows care teams to intercept decompensation early. Engaging family caregivers during bedside discharge planning ensures clear comprehension of warning signs, dietary restrictions, and scheduled appointments.

Paragraph 3: Organizational Coordination and Predictive Triage
Risk stratification tools like the LACE index and machine learning risk engines allow hospital discharge teams to allocate intense transitional resources to high-risk cohorts. Establishing direct communication channels between inpatient clinical teams and community health workers bridges socioeconomic gaps, mitigating transportation barriers and food insecurity that frequently precipitate emergency department visits. Continuous post-discharge tracking guarantees therapeutic continuity and substantially lowers preventable re-hospitalization rates.
""",

    "electronic_health_record_data_quality.txt": """DATA QUALITY CHALLENGES IN ELECTRONIC HEALTH RECORDS FOR CLINICAL RESEARCH
Institute of Biomedical Informatics

Paragraph 1: The Promise and Fragility of Secondary EHR Data
Electronic Health Records (EHR) capture immense quantities of real-world patient data across inpatient, outpatient, and emergency encounters. Secondary analysis of EHR repositories powers observational epidemiology, comparative effectiveness research, and deep learning diagnostic tools. However, secondary EHR data is inherently messy, collected primarily for administrative billing and clinical documentation rather than standardized scientific experimentation.

Paragraph 2: The Impact of Missing and Duplicate Records
Missing and duplicate records severely affect EHR data quality, compromising clinical research validity and patient safety. Duplicate patient records occur when identity matching algorithms fail due to typographical variations in patient names, mismatched birth dates, or fragmented health system identifiers. These duplicates fragment longitudinal patient histories, leading to repeated laboratory testing, contradictory medication lists, and erroneous clinical assessments. Conversely, missing clinical values—often non-randomly missing—distort statistical associations. For instance, diagnostic codes may only be entered when billing requires them, creating false negatives for mild or well-controlled chronic conditions. Addressing these defects necessitates robust master patient index (MPI) matching, probabilistic deduplication routines, and rigorous imputation methodologies.

Paragraph 3: Governance and Data Cleaning Frameworks
Modern healthcare organizations implement standardized common data models such as OMOP (Observational Medical Outcomes Partnership) and FHIR (Fast Healthcare Interoperability Resources) to harmonize disparate hospital records. Continuous automated data audits scan for logical inconsistencies, abnormal temporal sequences, and completeness metrics. Establishing comprehensive data provenance safeguards algorithmic fairness and guarantees that observational clinical research reflects true physiological phenomena rather than documentation artifacts.
""",

    "rag_and_semantic_similarity.txt": """RETRIEVAL-AUGMENTED GENERATION AND THE MECHANICS OF SEMANTIC SIMILARITY
Artificial Intelligence and Information Retrieval Laboratory

Paragraph 1: Foundations of Retrieval-Augmented Generation (RAG)
Large language models possess impressive generative capabilities but are susceptible to hallucination, factual obsolescence, and lack of domain-specific private knowledge. Retrieval-Augmented Generation (RAG) mitigates these weaknesses by combining neural information retrieval with parametric language generation. In a standard RAG architecture, an external corpus of documents is pre-processed, chunked into coherent textual units, and encoded into dense continuous vector spaces using specialized transformer embedding models.

Paragraph 2: Vector Embeddings and Cosine Similarity Retrieval
When a user issues an information query, the query string is projected into the identical vector space via the embedding model. Cosine similarity retrieves relevant document passages by measuring the cosine of the angle between the normalized query vector and stored document chunk vectors. Mathematically, for two normalized vectors u and v, cosine similarity equals their inner dot product, yielding a score between -1 and 1. Values approaching 1 denote close semantic orientation in high-dimensional space, regardless of lexical overlap. Unlike traditional keyword matching (such as BM25 or TF-IDF), semantic vector retrieval identifies contextual synonymy and conceptual relevance, successfully matching queries with relevant passages even when distinct vocabulary is employed.

Paragraph 3: Chunking Boundaries and Traceable Attribution
Effective retrieval depends critically on chunking strategy. Slicing documents into ~500 token segments with overlapping windows preserves sentence context while preventing semantic dilution. Furthermore, maintaining strict provenance metadata—such as source document identifiers, page numbers, paragraph indexes, and exact extracted line ranges—allows the retrieval engine to trace every generated insight directly back to the supporting source text, providing indispensable transparency for academic and clinical validation.
""",

    "antimicrobial_resistance_surveillance.txt": """GENOMIC SURVEILLANCE AND EPIDEMIOLOGY OF ANTIMICROBIAL RESISTANCE
Global Infectious Diseases and Pathogen Genomics Centre

Paragraph 1: The Escalating Global Threat of Resistant Pathogens
Antimicrobial resistance (AMR) represents one of the most pressing threats to modern global public health, compromising the effectiveness of standard antibiotics against common bacterial infections. Resistant strains of pathogens such as methicillin-resistant Staphylococcus aureus (MRSA), carbapenem-resistant Enterobacteriaceae (CRE), and multidrug-resistant Mycobacterium tuberculosis lead to increased mortality, prolonged hospital stays, and exorbitant medical costs.

Paragraph 2: Whole-Genome Sequencing in Bacterial Surveillance
Bacterial genomes support antimicrobial resistance surveillance by providing comprehensive, high-resolution insights into the genetic determinants of drug resistance. High-throughput Whole-Genome Sequencing (WGS) enables bioinformaticians to identify known antimicrobial resistance genes (ARGs), single-nucleotide polymorphisms (SNPs) in antibiotic target genes, and mobile genetic elements such as plasmids, transposons, and integrons that facilitate horizontal gene transfer. Genomic surveillance allows health authorities to track transmission chains across hospital wards, detect silent reservoir spread in food-producing animals, and discover emerging resistance mechanisms long before phenotypic culture testing finishes.

Paragraph 3: Integrated Global Surveillance Systems
Initiatives like the World Health Organization's Global Antimicrobial Resistance and Use Surveillance System (GLASS) increasingly combine phenotypic susceptibility data with genomic sequence databases. Cloud-based bioinformatic pipelines automate the identification of resistomes and virulence profiles from raw sequencing reads. This unified molecular surveillance enables proactive antimicrobial stewardship, informs empirical antibiotic prescribing guidelines, and accelerates targeted containment of multidrug-resistant bacterial outbreaks.
""",

    "renewable_energy_forecasting.txt": """DEMAND FORECASTING AND GRID INTEGRATION FOR RENEWABLE ENERGY SYSTEMS
Sustainable Energy Systems and Smart Grid Engineering

Paragraph 1: The Dynamics of Renewable Power Integration
The rapid decarbonization of the global energy sector relies heavily on expanding wind turbine installations and photovoltaic solar arrays. However, renewable generation is inherently non-dispatchable and weather-dependent, characterized by pronounced intermittency and diurnal fluctuations. Maintaining grid stability requires continuous equilibrium between electricity generation and instantaneous consumer load, demanding precise short-term and medium-term predictive models.

Paragraph 2: Methodologies for Energy Demand and Generation Forecasting
Renewable energy demand and generation can be forecast using a combination of numerical weather prediction (NWP) models, temporal convolutional networks, and deep recurrent neural networks such as Long Short-Term Memory (LSTM) architectures. Forecasting engines ingest real-time meteorological variables—including solar irradiance, cloud optical depth, ambient temperature, wind speed, and atmospheric pressure—alongside historical power grid consumption data, calendar seasonality, and industrial activity cycles. Ensemble hybrid architectures that combine physical weather simulations with attention-based neural models achieve high accuracy for intra-day hour-ahead and day-ahead predictions, facilitating economic dispatch and optimal battery storage scheduling.

Paragraph 3: Smart Grid Optimization and Demand-Side Response
Accurate demand forecasts enable automated demand-side response mechanisms, where flexible industrial loads and electric vehicle charging networks shift power consumption to coincide with peak solar and wind production intervals. Dynamic pricing algorithms incentivize consumers to reduce consumption during sudden wind dropouts or heavy cloud cover. Integrating advanced forecasting into smart transmission networks minimizes renewable curtailment, lowers spinning reserve requirements, and ensures a dependable, carbon-neutral power distribution infrastructure.
"""
}

def create_sample_files(target_dir: str):
    """Writes the 6 sample text files to the target directory if they don't exist."""
    os.makedirs(target_dir, exist_ok=True)
    for filename, content in SAMPLE_DOCS_CONTENT.items():
        file_path = os.path.join(target_dir, filename)
        if not os.path.exists(file_path):
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(content.strip() + "\n")

def seed_sample_documents(uploads_dir: str) -> List[Dict[str, Any]]:
    """
    Copies the 6 sample documents into uploads_dir (if not already indexed),
    parses them, generates embeddings, and saves them in the database.
    Returns list of indexed document records.
    """
    os.makedirs(uploads_dir, exist_ok=True)
    indexed_docs = []

    for filename, content in SAMPLE_DOCS_CONTENT.items():
        # Check if already in DB
        file_path = os.path.join(uploads_dir, filename)
        
        # Write file if not exists
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content.strip() + "\n")

        file_size = os.path.getsize(file_path)
        doc_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, filename))

        # Check existing document in DB
        existing = get_document(doc_id)
        if existing and existing["status"] == "indexed":
            indexed_docs.append(existing)
            continue

        doc_data = {
            "id": doc_id,
            "filename": filename,
            "file_type": "txt",
            "file_size": file_size,
            "file_path": file_path,
            "upload_date": datetime.now().isoformat(),
            "chunk_count": 0,
            "status": "processing",
            "error_message": None,
            "raw_content": content
        }
        insert_document(doc_data)

        try:
            chunks, raw_content = parse_document(file_path, filename, "txt")
            for c in chunks:
                c["document_id"] = doc_id
            
            chunks_with_emb = generate_embeddings_for_chunks(chunks)
            insert_chunks(chunks_with_emb)
            
            from database import update_document_status
            update_document_status(doc_id, "indexed", len(chunks), None, raw_content)
            
            doc_data["chunk_count"] = len(chunks)
            doc_data["status"] = "indexed"
            indexed_docs.append(doc_data)
        except Exception as e:
            from database import update_document_status
            update_document_status(doc_id, "error", 0, str(e))
            doc_data["status"] = "error"
            doc_data["error_message"] = str(e)
            indexed_docs.append(doc_data)

    return indexed_docs

