from pypdf import PdfReader, PdfWriter
from pdf2docx import Converter
import os
import subprocess

def merge_pdfs(input_paths, output_path):
    writer = PdfWriter()
    for path in input_paths:
        writer.append(path)
    with open(output_path, "wb") as f:
        writer.write(f)
    return output_path

def split_pdf(input_path, output_dir):
    reader = PdfReader(input_path)
    output_files = []
    for i, page in enumerate(reader.pages):
        writer = PdfWriter()
        writer.add_page(page)
        output_path = os.path.join(output_dir, f"page_{i+1}.pdf")
        with open(output_path, "wb") as f:
            writer.write(f)
        output_files.append(output_path)
    return output_files

def pdf_to_word(input_path, output_path):
    cv = Converter(input_path)
    cv.convert(output_path, start=0, end=None)
    cv.close()
    return output_path

def word_to_pdf(input_path, output_path):
    # Uses LibreOffice for high-fidelity conversion on Linux
    try:
        subprocess.run([
            "libreoffice", "--headless", "--convert-to", "pdf", 
            input_path, "--outdir", os.path.dirname(output_path)
        ], check=True)
        # LibreOffice names it input_filename.pdf
        generated_pdf = os.path.join(os.path.dirname(output_path), os.path.splitext(os.path.basename(input_path))[0] + ".pdf")
        if generated_pdf != output_path:
            os.rename(generated_pdf, output_path)
        return output_path
    except Exception as e:
        print(f"Error in word_to_pdf: {e}")
        raise e
